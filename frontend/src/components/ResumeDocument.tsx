import React from 'react';
import { ResumeData } from '../types';
import { Mail, Phone, MapPin, Linkedin, Github, ExternalLink } from 'lucide-react';

interface ResumeDocumentProps {
  data: ResumeData;
  templateStyle?: 'modern' | 'minimal' | 'executive';
}

export const ResumeDocument: React.FC<ResumeDocumentProps> = ({
  data,
  templateStyle = 'modern',
}) => {
  const { personalInfo, experience, skills, education, projects } = data;

  return (
    <div
      id="resume-printable-doc"
      className={`w-full bg-white text-slate-900 p-8 sm:p-12 select-text font-sans ${
        templateStyle === 'executive'
          ? 'font-serif border-t-8 border-slate-900'
          : templateStyle === 'minimal'
          ? 'font-mono text-xs'
          : 'font-sans'
      }`}
      style={{
        minHeight: '1050px',
      }}
    >
      {/* Header */}
      <header className="border-b border-slate-300 pb-5 mb-6">
        <div className="flex justify-between items-baseline flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {personalInfo.firstName} {personalInfo.lastName}
            </h1>
            <p className="text-sm sm:text-base font-semibold text-blue-700 mt-0.5 tracking-wide">
              {personalInfo.title || data.title}
            </p>
          </div>
          <div className="text-right text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 justify-end">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{personalInfo.email}</span>
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{personalInfo.phone}</span>
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{personalInfo.location}</span>
            </div>
            {personalInfo.linkedin && (
              <div className="flex items-center gap-1.5 justify-end">
                <Linkedin className="w-3.5 h-3.5 text-slate-400" />
                <span>{personalInfo.linkedin}</span>
              </div>
            )}
            {personalInfo.github && (
              <div className="flex items-center gap-1.5 justify-end">
                <Github className="w-3.5 h-3.5 text-slate-400" />
                <span>{personalInfo.github}</span>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        {personalInfo.summary && (
          <p className="mt-4 text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
            {personalInfo.summary}
          </p>
        )}
      </header>

      {/* Experience Section */}
      <section className="mb-6 break-inside-avoid">
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-600 rounded-full inline-block"></span>
          Professional Experience
        </h2>
        <div className="space-y-4">
          {experience.map((exp) => (
            <article key={exp.id} className="text-xs break-inside-avoid">
              <div className="flex justify-between items-baseline flex-wrap">
                <h3 className="font-bold text-slate-900 text-sm">{exp.role}</h3>
                <span className="text-slate-500 font-medium font-mono text-[11px]">
                  {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 italic mb-1.5">
                <span>{exp.company}</span>
                <span className="text-[11px] not-italic text-slate-400">{exp.location}</span>
              </div>
              <ul className="list-disc list-outside ml-4 space-y-1 text-slate-700 leading-normal">
                {exp.bullets.map((bullet, idx) => (
                  <li key={idx} className="text-[11.5px] leading-relaxed">
                    {bullet}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* Skills Matrix */}
      <section className="mb-6 break-inside-avoid">
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-indigo-600 rounded-full inline-block"></span>
          Technical Core &amp; Competencies
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {skills.languages?.length > 0 && (
            <div>
              <span className="font-bold text-slate-900">Languages: </span>
              <span className="text-slate-700">{skills.languages.join(', ')}</span>
            </div>
          )}
          {skills.frameworks?.length > 0 && (
            <div>
              <span className="font-bold text-slate-900">Frameworks: </span>
              <span className="text-slate-700">{skills.frameworks.join(', ')}</span>
            </div>
          )}
          {skills.tools?.length > 0 && (
            <div>
              <span className="font-bold text-slate-900">Developer Tools: </span>
              <span className="text-slate-700">{skills.tools.join(', ')}</span>
            </div>
          )}
          {skills.cloud?.length > 0 && (
            <div>
              <span className="font-bold text-slate-900">Cloud &amp; Databases: </span>
              <span className="text-slate-700">{skills.cloud.join(', ')}</span>
            </div>
          )}
        </div>
      </section>

      {/* Key Projects */}
      {projects && projects.length > 0 && (
        <section className="mb-6 break-inside-avoid">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-sky-600 rounded-full inline-block"></span>
            Featured Engineering Projects
          </h2>
          <div className="space-y-3">
            {projects.map((proj) => (
              <article key={proj.id} className="text-xs break-inside-avoid">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-slate-900">{proj.name}</h3>
                  {proj.link && (
                    <span className="text-[11px] text-blue-700 font-mono flex items-center gap-1">
                      {proj.link}
                    </span>
                  )}
                </div>
                <p className="text-slate-700 text-[11.5px] mt-0.5 leading-relaxed">{proj.description}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {proj.tech.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-mono"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <section className="break-inside-avoid">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2.5 flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-600 rounded-full inline-block"></span>
            Education &amp; Credentials
          </h2>
          <div className="space-y-2">
            {education.map((edu) => (
              <div key={edu.id} className="text-xs flex justify-between items-baseline flex-wrap break-inside-avoid">
                <div>
                  <span className="font-bold text-slate-900">{edu.degree}</span> in {edu.field}
                  <div className="text-slate-600 text-[11px]">{edu.institution} — {edu.location}</div>
                </div>
                <span className="font-mono text-slate-500 text-[11px]">{edu.graduationYear}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
