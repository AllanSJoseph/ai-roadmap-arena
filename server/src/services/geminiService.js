import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

if (!apiKey) {
  console.warn('Warning: GEMINI_API_KEY is not defined in environment variables.');
}

const ai = new GoogleGenAI({ apiKey });

// Schema for generating a structured roadmap
const roadmapResponseSchema = {
  type: "object",
  properties: {
    checkpoints: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          topics: {
            type: "array",
            items: { type: "string" }
          },
          estimated_hours: { type: "integer" },
          resources: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                url: { type: "string" },
                type: { type: "string" }
              },
              required: ["title", "url", "type"]
            }
          }
        },
        required: ["id", "title", "description", "topics", "estimated_hours", "resources"]
      }
    }
  },
  required: ["checkpoints"]
};

// Schema for generating MCQ quizzes
const quizResponseSchema = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          text: { type: "string" },
          options: {
            type: "array",
            items: { type: "string" }
          },
          correct_answer_index: { type: "integer" }
        },
        required: ["id", "text", "options", "correct_answer_index"]
      }
    }
  },
  required: ["questions"]
};

/**
 * Generates a personalized roadmap for a given role and user profile context.
 */
export const generateRoadmap = async (role, experienceLevel, context, specializations) => {
  const prompt = `Generate a comprehensive, step-by-step career path roadmap for the role of "${role}" with the experience level "${experienceLevel}". 
Consider the user's details: "${context}".
Prioritize topics matching the specializations: ${specializations.join(", ")}.
Provide between 5 to 10 sequential checkpoints detailing specific milestones, concepts to master, estimated timeline, and helpful resources.
Ensure every checkpoint has a unique alphabetical ID (e.g. cp-1-basics, cp-2-advanced).`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: roadmapResponseSchema,
        systemInstruction: "You are an expert career advisor and senior software architect. Create practical, logical, sequential roadmap paths that are custom tailored to the user's specific context, background, and specializations."
      }
    });

    const parsedData = JSON.parse(response.text);
    return parsedData;
  } catch (error) {
    console.error('Error generating roadmap with Gemini:', error);
    throw new Error('Failed to generate roadmap from AI. ' + error.message);
  }
};

/**
 * Generates a 5-question MCQ quiz for a specific checkpoint.
 */
export const generateQuiz = async (checkpointTitle, checkpointDescription, topics, userContext) => {
  const prompt = `Generate a 5-question multiple choice quiz testing the user's practical understanding of the checkpoint: "${checkpointTitle}" (${checkpointDescription}).
The quiz must cover these specific topics: ${topics.join(", ")}.
Ensure the questions are conceptual or practical (e.g. including short code scenarios where appropriate for coding roles).
Each question must have exactly 4 choices. Only one choice should be correct.
Align the difficulty with the user's background details: "${userContext}".`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: quizResponseSchema,
        systemInstruction: "You are an expert interviewer. Create 5 multiple-choice questions (MCQs) that verify core conceptual understanding. Provide clear, plausible distractor choices. Do not make the correct choice obvious."
      }
    });

    const parsedData = JSON.parse(response.text);
    return parsedData;
  } catch (error) {
    console.error('Error generating quiz with Gemini:', error);
    throw new Error('Failed to generate quiz from AI. ' + error.message);
  }
};

/**
 * Generates a twisted retest based on the questions from a user's previous attempt.
 */
export const generateRetest = async (checkpointTitle, topics, previousQuestions, userAnswers) => {
  const prompt = `You are generating a twisted retest for a student who failed their previous test on the topics: ${topics.join(", ")}.
The checkpoint is: "${checkpointTitle}".

Here are the questions they were asked previously:
${JSON.stringify(previousQuestions, null, 2)}

Here are the answers the student gave (the index of their option choice):
${JSON.stringify(userAnswers, null, 2)}

Your goal is to generate 5 brand new multiple choice questions covering the identical core concepts of the questions they struggled with or got wrong.
The questions must not be identical; twist the scenarios, apply practical code examples, or change the aspect being tested so they cannot pass by memorizing answers.
Each question must have exactly 4 choices and only one correct choice.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: quizResponseSchema,
        systemInstruction: "You are an expert interviewer. Create a new set of MCQs. They must test the exact same concepts as the failed questions, but using altered context, different variables, or reversed logic so that memorized answers will not work."
      }
    });

    const parsedData = JSON.parse(response.text);
    return parsedData;
  } catch (error) {
    console.error('Error generating retest with Gemini:', error);
    throw new Error('Failed to generate retest from AI. ' + error.message);
  }
};
