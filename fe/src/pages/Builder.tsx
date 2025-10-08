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

  // Update files based on steps
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

  // Mount files in WebContainer
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

  // Initialize template
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

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-black px-6 py-4 shadow-md">
        <h1 className="text-2xl font-bold text-white">AiForge</h1>
        <p className="text-sm text-gray-200 mt-1 truncate">Prompt: {prompt}</p>
      </header>

      {/* Main Grid */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-12 gap-6 p-6">
          
          {/* Steps Panel */}
          <div className="col-span-3 space-y-6 overflow-auto bg-gray-800 rounded-lg p-4 shadow-md">
            <h2 className="text-lg font-semibold text-white mb-2">Steps</h2>
            <div className="max-h-[70vh] overflow-y-auto">
              <StepsList steps={steps} currentStep={currentStep} onStepClick={setCurrentStep} />
            </div>

            <div className='mt-4'>
              {(loading || !templateSet) && <Loader />}
              {!(loading || !templateSet) && (
                <div className='flex flex-col gap-2'>
                  <textarea
                    value={userPrompt}
                    onChange={e => setUserPrompt(e.target.value)}
                    placeholder="Ask the assistant..."
                    className='p-2 rounded-md w-full bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                  />
                  <button
                    className='bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-md py-2 mt-1 transition-all'
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

          {/* File Explorer */}
          <div className="col-span-3 bg-gray-800 rounded-lg p-4 shadow-md">
            <h2 className="text-lg font-semibold text-white mb-2">Files</h2>
            <FileExplorer files={files} onFileSelect={setSelectedFile} />
          </div>

          {/* Code / Preview Area */}
          <div className="col-span-6 bg-gray-900 rounded-lg shadow-lg p-4 flex flex-col h-[calc(100vh-8rem)]">
            <TabView activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="flex-1 mt-2 overflow-auto">
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
