import { apiClient } from './client';

export type PromptAttachment = {
  type: 'image' | 'audio_transcription';
  url: string | null;
  text?: string | null;
};

export type ProcessPromptRequest = {
  text: string;
  attachments?: PromptAttachment[] | null;
};

export type PromptEntityResponse = {
  title?: string;
  description?: string;
  scheduled_date?: string; // YYYY-MM-DD
  scheduled_time?: string; // HH:mm
  recurrence?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval?: number;
  } | null;
};

export type ProcessPromptResponse = {
  success: boolean;
  message: string;
  data: {
    prompt_request_id: string;
    parse_status: 'success' | 'unsupported' | 'failed' | 'requires_confirmation';
    intent: string | null;
    confidence_score?: number;
    requires_confirmation: boolean;
    confirmation?: {
      question: string;
      entities: PromptEntityResponse;
    } | null;
    result: any | null;
    human_response: string;
  };
};

export type ConfirmPromptResponse = {
  success: boolean;
  message: string;
  data: {
    prompt_request_id: string;
    result: any;
    human_response: string;
  };
};

export type UploadResponse = {
  success: boolean;
  message: string;
  data: {
    url: string;
    path: string;
    type: string;
    mime_type: string;
    size: string;
    original_name: string;
  };
};

export const extractApi = {
  processPrompt: async (text: string, attachments?: PromptAttachment[] | null) => {
    const { data } = await apiClient.post<ProcessPromptResponse>('/v1/prompts', {
      text,
      attachments: attachments || null,
    });
    return data;
  },

  confirmPrompt: async (promptRequestId: string, confirmed: boolean) => {
    const { data } = await apiClient.post<ConfirmPromptResponse>(`/v1/prompts/${promptRequestId}/confirm`, {
      confirmed,
    });
    return data;
  },

  uploadFile: async (fileUri: string, fileName: string, mimeType: string, type: 'image' | 'audio' | 'document') => {
    const formData = new FormData();
    // In React Native, files are attached as an object with uri, name, and type
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: mimeType,
    } as any);
    formData.append('type', type);

    const { data } = await apiClient.post<UploadResponse>('/v1/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
};
