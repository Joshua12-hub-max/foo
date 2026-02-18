import React, { useState } from 'react';
import { FamilyBackground } from './components/Wizard/FamilyBackground';

const SECTIONS = [
    { id: 'family', label: 'Family Background' },
    { id: 'education', label: 'Educational Background' },
    { id: 'civil_service', label: 'Civil Service Eligibility' },
    { id: 'work_experience', label: 'Work Experience' },
    { id: 'voluntary_work', label: 'Voluntary Work' },
    { id: 'learning', label: 'Learning & Development' },
    { id: 'other', label: 'Other Information' }
];

// ...

interface PDSFormWizardProps {
    employeeId?: number;
}

export const PDSFormWizard: React.FC<PDSFormWizardProps> = ({ employeeId }) => {
    const [activeSection, setActiveSection] = useState('family');
    
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-200 overflow-x-auto">
                {SECTIONS.map(section => (
                    <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`px-6 py-4 text-sm font-semibold whitespace-nowrap transition-colors ${
                            activeSection === section.id 
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                        {section.label}
                    </button>
                ))}
            </div>
            
            <div className="p-6">
                {/* Content Area - Header removed as it is inside component now */}
                
                <div className="min-h-[400px]">
                    {activeSection === 'family' && <FamilyBackground employeeId={employeeId} />}
                    {activeSection !== 'family' && (
                        <div className="flex items-center justify-center h-64 text-gray-400">
                             Feature coming soon...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
