import React, { useState } from 'react';
import type { Template } from '../types';
import { TrashIcon } from './icons';

interface TemplatesViewProps {
  templates: Template[];
  addTemplate: (template: Template) => void;
  deleteTemplate: (id: string) => void;
  useTemplate: (instructions: string) => void;
}

const TemplatesView: React.FC<TemplatesViewProps> = ({ templates, addTemplate, deleteTemplate, useTemplate }) => {
  const [newName, setNewName] = useState('');
  const [newInstructions, setNewInstructions] = useState('');

  const handleAddTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newInstructions.trim()) return;
    const newTemplate: Template = {
      id: Date.now().toString(),
      name: newName,
      instructions: newInstructions,
    };
    addTemplate(newTemplate);
    setNewName('');
    setNewInstructions('');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold text-white mb-8">Instruction Templates</h2>
      
      {/* Add New Template Form */}
      <div className="bg-gray-900 p-8 rounded-lg border border-gray-700 shadow-lg">
        <h3 className="text-xl font-semibold mb-6">Create New Template</h3>
        <form onSubmit={handleAddTemplate} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="templateName" className="text-sm text-gray-300">Template Name</label>
            <input
              id="templateName"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g., 'Project Update Request'"
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="templateInstructions" className="text-sm text-gray-300">Instructions</label>
            <textarea
              id="templateInstructions"
              value={newInstructions}
              onChange={(e) => setNewInstructions(e.target.value)}
              placeholder="Template Instructions for Gemini..."
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-3 text-white resize-y focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[120px]"
              rows={4}
              required
            />
          </div>
          <button type="submit" className="w-full md:w-auto bg-primary-500 text-white font-semibold py-3 px-6 rounded-md hover:bg-primary-600 transition-colors">
            Add Template
          </button>
        </form>
      </div>

      {/* Existing Templates List */}
      <div className="space-y-6 mt-12">
        <h3 className="text-xl font-semibold">Your Templates</h3>
        {templates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {templates.map(template => (
              <div key={template.id} className="bg-gray-800 p-6 rounded-lg border border-gray-700 flex flex-col justify-between hover:border-gray-600 transition-all shadow-lg">
                <div>
                  <h4 className="font-bold text-white text-lg mb-3">{template.name}</h4>
                  <p className="text-sm text-gray-400 break-words leading-relaxed">{template.instructions}</p>
                </div>
                <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-700">
                  <button 
                    onClick={() => useTemplate(template.instructions)} 
                    className="text-sm bg-primary-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-primary-600 transition-colors flex items-center gap-2"
                  >
                    Use Template
                  </button>
                  <button 
                    onClick={() => deleteTemplate(template.id)} 
                    className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-gray-700" 
                    aria-label={`Delete ${template.name} template`}
                  >
                    <TrashIcon className="w-5 h-5"/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">You have no saved templates.</p>
        )}
      </div>
    </div>
  );
};

export default TemplatesView;
