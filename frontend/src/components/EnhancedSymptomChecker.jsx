import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'


const EnhancedSymptomChecker = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // State for form inputs
  const [helpType, setHelpType] = useState('medical_assistance');
  const [textInput, setTextInput] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [pdfWarning, setPdfWarning] = useState(false);
  
  // State for API response and loading
  const [aiResponse, setAiResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Handle image file selection and preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      
      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle attachment file selection (PDF or image)
  const handleAttachmentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachmentFile(file);
      setPdfWarning(file.type === 'application/pdf');
    }
  };

  // Convert file to base64 (for API sending)
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
    });
  };

  // Handle form submission
  const handleSubmit = async () => {
    setError('');
    setAiResponse('');
    setIsSubmitting(true);

    try {
      // Validate input
      if (!textInput.trim() && !imageFile && !attachmentFile) {
        setError(t('symptomChecker.emptyInput'));
        setIsSubmitting(false);
        return;
      }

      // Get API key from environment variables
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        setError(t('symptomChecker.apiKeyError'));
        setIsSubmitting(false);
        return;
      }

      // Map help type to system prompt
      const promptMap = {
        medical_assistance: t('symptomChecker.prompts.medicalAssistance'),
        prescription_reader: t('symptomChecker.prompts.prescriptionReader'),
        medicine_describer: t('symptomChecker.prompts.medicineDescriber'),
        report_analyzer: t('symptomChecker.prompts.reportAnalyzer')
      };
      
      const systemPrompt = promptMap[helpType] || t('symptomChecker.prompts.default');

      // Prepare request parts
      const requestParts = [];
      
      // Add system prompt
      requestParts.push({
        role: 'user',
        parts: [{ text: systemPrompt }]
      });

      // Add user text input
      if (textInput.trim()) {
        requestParts.push({
          role: 'user',
          parts: [{ text: textInput }]
        });
      }

      // Add image file if present
      if (imageFile) {
        const imageBase64 = await fileToBase64(imageFile);
        requestParts.push({
          role: 'user',
          parts: [{
            inlineData: {
              mimeType: imageFile.type,
              data: imageBase64
            }
          }]
        });
      }

      // Add attachment file if present
      if (attachmentFile) {
        const attachmentBase64 = await fileToBase64(attachmentFile);
        requestParts.push({
          role: 'user',
          parts: [{
            inlineData: {
              mimeType: attachmentFile.type,
              data: attachmentBase64
            }
          }]
        });
      }

      // Make API call to Gemini API
      // const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
      const response = await axios.post(apiUrl, {
        contents: requestParts,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000
        }
      });

      // Process response
      if (response.data && response.data.candidates && response.data.candidates.length > 0) {
        const candidate = response.data.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          const generatedText = candidate.content.parts[0].text;
          setAiResponse(generatedText);
        } else {
          setError(t('symptomChecker.noResponse'));
        }
      } else {
        setError(t('symptomChecker.noResponse'));
      }
    } catch (error) {
      console.error('API Error:', error);
      if (error.response) {
        if (error.response.status === 401) {
          setError(t('symptomChecker.apiUnauthorized'));
        } else if (error.response.status === 429) {
          setError(t('symptomChecker.rateLimit'));
        } else {
          setError(t('symptomChecker.noResponse'));
        }
      } else {
        setError(t('symptomChecker.noResponse'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form function
  const resetForm = () => {
    setTextInput('');
    setImageFile(null);
    setAttachmentFile(null);
    setImagePreview('');
    setPdfWarning(false);
    setAiResponse('');
    setError('');
  };

  // Navigate to doctors page
  const handleFindDoctor = () => {
    navigate('/doctors');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">{t('symptomChecker.title')}</h2>
          <p className="text-gray-600 mb-6 text-center">
            {t('symptomChecker.description')}
          </p>

          {/* Assistance Type Selection */}
          <div className="w-full mb-4">
            <label htmlFor="helpType" className="block text-gray-700 font-medium mb-2">
              {t('symptomChecker.helpType')}
            </label>
            <select
              id="helpType"
              value={helpType}
              onChange={(e) => setHelpType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="medical_assistance">{t('symptomChecker.helpTypes.medicalAssistance')}</option>
              <option value="prescription_reader">{t('symptomChecker.helpTypes.prescriptionReader')}</option>
              <option value="medicine_describer">{t('symptomChecker.helpTypes.medicineDescriber')}</option>
              <option value="report_analyzer">{t('symptomChecker.helpTypes.reportAnalyzer')}</option>
            </select>
          </div>

          {/* Text Input */}
          <div className="w-full mb-4">
            <label htmlFor="textInput" className="block text-gray-700 font-medium mb-2">
              {t('symptomChecker.textInput')}
            </label>
            <textarea
              id="textInput"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={t('symptomChecker.textInputPlaceholder')}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
            />
          </div>

          {/* Image Upload */}
          <div className="w-full mb-4">
            <label htmlFor="imageInput" className="block text-gray-700 font-medium mb-2">
              {t('symptomChecker.imageInput')}
            </label>
            <input
              type="file"
              id="imageInput"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="w-full mb-4">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="max-w-full h-auto rounded-md border border-gray-200"
                style={{ maxHeight: '300px' }}
              />
            </div>
          )}

          {/* Attachment Upload */}
          <div className="w-full mb-6">
            <label htmlFor="attachmentInput" className="block text-gray-700 font-medium mb-2">
              {t('symptomChecker.attachmentInput')}
            </label>
            <input
              type="file"
              id="attachmentInput"
              accept="image/*,.pdf"
              onChange={handleAttachmentChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('symptomChecker.attachmentNote')}
            </p>
          </div>

          {/* PDF Warning */}
          {pdfWarning && (
            <div className="w-full mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                {t('symptomChecker.pdfWarning')}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="w-full mb-6">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition duration-300 ease-in-out"
            >
              {isSubmitting ? t('symptomChecker.thinking') : t('symptomChecker.getAssistance')}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="w-full p-4 bg-red-50 border border-red-200 rounded-md mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isSubmitting && (
            <div className="w-full p-4 bg-gray-50 border border-gray-200 rounded-md mb-6 text-center">
              <p className="text-gray-700">{t('symptomChecker.analyzing')}</p>
            </div>
          )}

          {/* AI Response */}
          {aiResponse && (
            <div className="w-full p-4 bg-green-50 border border-green-200 rounded-md mb-6">
              <h3 className="text-lg font-medium text-green-800 mb-2">{t('symptomChecker.aiResponse')}</h3>
              {/* <div className="text-green-700 whitespace-pre-line">{aiResponse}</div> */}
              <div className="prose prose-green max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {aiResponse}
                </ReactMarkdown>
              </div>

            </div>
          )}

          {/* Action Buttons */}
          {(aiResponse || error) && (
            <div className="flex w-full space-x-2">
              <button
                onClick={() => resetForm()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-300 ease-in-out"
              >
                {t('symptomChecker.checkAnother')}
              </button>
              <button
                onClick={handleFindDoctor}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition duration-300 ease-in-out"
              >
                {t('symptomChecker.findDoctor')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedSymptomChecker;