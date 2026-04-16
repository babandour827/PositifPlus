import React from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

interface LanguageSelectorProps {
  className?: string;
  vertical?: boolean;
  buttonSize?: 'small' | 'medium' | 'large';
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  className, 
  vertical = false,
  buttonSize = 'medium' 
}) => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const languages = [
    { code: 'fr', name: 'Français' },
    { code: 'en', name: 'English' },
    { code: 'wo', name: 'Wolof' }
  ];

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    localStorage.setItem('language', language);
  };

  const buttonClasses = clsx(
    'transition-colors duration-200 font-medium rounded-md',
    {
      'px-2 py-1 text-xs': buttonSize === 'small',
      'px-3 py-1.5 text-sm': buttonSize === 'medium',
      'px-4 py-2 text-base': buttonSize === 'large',
    }
  );

  const activeButtonClasses = 'bg-primary-500 text-white';
  const inactiveButtonClasses = 'bg-gray-100 text-gray-700 hover:bg-gray-200';

  return (
    <div className={clsx('flex', vertical ? 'flex-col space-y-2' : 'flex-row space-x-2', className)}>
      {languages.map((language) => (
        <button
          key={language.code}
          onClick={() => changeLanguage(language.code)}
          className={clsx(
            buttonClasses,
            currentLanguage === language.code ? activeButtonClasses : inactiveButtonClasses
          )}
          aria-pressed={currentLanguage === language.code}
        >
          {language.name}
        </button>
      ))}
    </div>
  );
};

export default LanguageSelector;