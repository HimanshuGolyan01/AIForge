import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { StepsList } from '../components/StepsList';
import { FileExplorer } from '../components/FileExplorer';
import { TabView } from '../components/TabView';
import { CodeEditor } from '../components/CodeEditor';
import { PreviewFrame } from '../components/PreviewFrame';
import { Step, FileItem, StepType } from '../types';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import { parseXml } from '../steps';
import { useWebContainer } from '../hooks/useWebContainer';
import { Loader } from '../components/Loader';

export function Builder() {
  const location = useLocation();
  const { prompt } = location.state as { prompt: string };

  const [userPrompt, setUserPrompt] = useState("");
  const [llmMessages, setLlmMessages] = useState<{role: "user" | "assistant"; content: string;}[]>([]);
  const [loading, setLoading] = useState(false);
  const [templateSet, setTemplateSet] = useState(false);

  const webcontainer = useWebContainer();

  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  
  const [steps, setSteps] = useState<Step[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);

  // ----------------------
  // Update file structure based on steps
  // ----------------------
  useEffect(() => {
    let updatedFiles = [...files];
    let updateHappened = false;

    steps.filter(s => s.status === "pending").forEach(step => {
      updateHappened = true;
      if (step.type === StepType.CreateFile && step.path) {
        const parts = step.path.split("/");
        let currentLevel = updatedFiles;
        let pathAcc = "";

        parts.forEach((part, index) => {
          pathAcc += "/" + part;
          const existing = currentLevel.find(f => f.path === pathAcc);
          
          if (index === parts.length - 1) {
            if (!existing) {
              currentLevel.push({ name: part, type: 'file', path: pathAcc, content: step.code });
            } else {
              existing.content = step.code;
            }
          } else {
            if (!existing) {
              const folder: FileItem = { name: part, type: 'folder', path: pathAcc, children: [] };
              currentLevel.push(folder);
              currentLevel = folder.children!;
            } else {
              currentLevel = existing.children!;
            }
          }
        });
      }
    });

    if (updateHappened) {
      setFiles(updatedFiles);
      setSteps(s => s.map(step => ({ ...step, status: "completed" })));
    }
  }, [steps]);

  // ----------------------
  // Mount files into WebContainer
  // ----------------------
  useEffect(() => {
    if (!webcontainer) return;

    const mountStructure = (files: FileItem[]) => {
      const result: Record<string, any> = {};
      files.forEach(file => {
        if (file.type === 'folder') {
          result[file.name] = { directory: mountStructure(file.children ?? []) };
        } else {
          result[file.name] = { file: { contents: file.content ?? '' } };
        }
      });
      return result;
    };

    webcontainer.mount(mountStructure(files));
  }, [files, webcontainer]);

  // ----------------------
  // Initialize template from backend
  // ----------------------
  const init = async () => {
    try {
      setLoading(true);

      const templateResponse = await axios.post(
        `${BACKEND_URL}/template`,
        { prompt: prompt.trim() },
        { headers: { "Content-Type": "application/json" } }
      );

      setTemplateSet(true);

      const { prompts, uiPrompts } = templateResponse.data;

      setSteps(parseXml(uiPrompts[0]).map((x: Step) => ({ ...x, status: "pending" })));

      const chatResponse = await axios.post(
        `${BACKEND_URL}/chat`,
        { messages: [...prompts, prompt].map(c => ({ role: "user", content: c })) },
        { headers: { "Content-Type": "application/json" } }
      );

      const newSteps = parseXml(chatResponse.data.response).map((x: Step) => ({ ...x, status: "pending" }));

      setSteps(s => [...s, ...newSteps]);
      setLlmMessages([...prompts.map(c => ({ role: "user" as const, content: c })), { role: "assistant", content: chatResponse.data.response }]);

    } catch (err) {
      console.error("Error initializing template:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    init();
  }, []);

  // ----------------------
  // Render
  // ----------------------
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-100">Website Builder</h1>
        <p className="text-sm text-gray-400 mt-1">Prompt: {prompt}</p>
      </header>

      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-4 gap-6 p-6">
          <div className="col-span-1 space-y-6 overflow-auto">
            <div className="max-h-[75vh] overflow-scroll">
              <StepsList steps={steps} currentStep={currentStep} onStepClick={setCurrentStep} />
            </div>

            <div className='flex flex-col gap-2'>
              {(loading || !templateSet) && <Loader />}
              {!(loading || !templateSet) && (
                <div className='flex gap-2'>
                  <textarea value={userPrompt} onChange={e => setUserPrompt(e.target.value)} className='p-2 w-full'></textarea>
                  <button
                    className='bg-purple-400 px-4'
                    onClick={async () => {
                      const newMessage = { role: "user" as const, content: userPrompt };
                      setLoading(true);

                      const response = await axios.post(
                        `${BACKEND_URL}/chat`,
                        { messages: [...llmMessages, newMessage] },
                        { headers: { "Content-Type": "application/json" } }
                      );

                      setLoading(false);
                      setLlmMessages(x => [...x, newMessage, { role: "assistant", content: response.data.response }]);
                      setSteps(s => [...s, ...parseXml(response.data.response).map(x => ({ ...x, status: "pending" }))]);
                    }}
                  >
                    Send
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-1">
            <FileExplorer files={files} onFileSelect={setSelectedFile} />
          </div>

          <div className="col-span-2 bg-gray-900 rounded-lg shadow-lg p-4 h-[calc(100vh-8rem)]">
            <TabView activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="h-[calc(100%-4rem)]">
              {activeTab === 'code' ? (
                <CodeEditor file={selectedFile} />
              ) : (
                <PreviewFrame webContainer={webcontainer} files={files} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
