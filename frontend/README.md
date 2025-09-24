# Rural Telemedicine - Multilingual Frontend Setup

This document provides instructions for setting up and maintaining the multilingual frontend of the Rural Telemedicine application.

## Features
- English, Hindi, and Punjabi language support
- Language selector in the header navigation
- Translated content for all main pages and components
- SEO-friendly implementation using react-i18next

## Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository
2. Navigate to the frontend directory
   ```bash
   cd frontend
   ```
3. Install dependencies
   ```bash
   npm install
   ```

## Running the Application

```bash
npm run dev
```

This will start the development server at http://localhost:5173

## Multilingual Implementation

### Translation Files
All translation files are located in the `src/translations/` directory:
- `en.json` - English translations
- `hi.json` - Hindi translations
- `pa.json` - Punjabi translations

### Adding New Translations
1. Open the respective language file
2. Add new key-value pairs for the content you want to translate
3. Ensure keys are consistent across all language files

### Using Translations in Components
1. Import the useTranslation hook
   ```javascript
   import { useTranslation } from 'react-i18next'
   ```
2. Initialize the hook in your component
   ```javascript
   const { t } = useTranslation()
   ```
3. Use the t function to translate text
   ```jsx
   <h1>{t('hero.title')}</h1>
   ```

### Adding a New Language
1. Create a new translation file in `src/translations/` (e.g., `fr.json` for French)
2. Add all translation keys with the new language content
3. Update the `i18n.js` configuration file to include the new language
   ```javascript
   i18next
     .use(initReactI18next)
     .init({
       resources: {
         en: { translation: en },
         hi: { translation: hi },
         pa: { translation: pa },
         fr: { translation: fr } // Add new language here
       },
       lng: 'en',
       fallbackLng: 'en',
       // ... other options
     })
   ```
4. Update the language selector in the Navbar component to include the new language option

## Notes
- Always ensure that all translation files are updated when adding new content
- Use descriptive and consistent keys for translations
- Test the application with different languages to ensure proper rendering
- For RTL languages (like Arabic), additional CSS may be required

## License
[MIT](LICENSE)