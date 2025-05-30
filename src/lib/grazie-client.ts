import { GrazieConfig, GrazieRequest, GrazieResponse, SentenceWithProblems, CorrectionServiceType, Language } from '@/types/grazie';

export class GrazieClient {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly agent: { name: string; version: string };

  constructor(config: GrazieConfig) {
    this.baseUrl = config.baseUrl || 'https://api.app.prod.grazie.aws.intellij.net';
    this.token = config.token;
    this.agent = config.agent || { name: 'typostry', version: '1.0.0' };
  }

  /**
   * Correct grammar and spelling errors in the provided sentences
   */
  async correctText(
    sentences: string[],
    language: Language,
    services?: CorrectionServiceType[]
  ): Promise<any> {
    const payload: GrazieRequest = {
      sentences,
      lang: language,
      services: services || [CorrectionServiceType.MLEC, CorrectionServiceType.SPELL, CorrectionServiceType.RULE]
    };

    try {
      console.log('Grazie API Request:', {
        url: `${this.baseUrl}/user/v5/gec/correct/v3`,
        headers: {
          'Content-Type': 'application/json',
          'Grazie-Authenticate-JWT': this.token.substring(0, 20) + '...',
          'Grazie-Agent': JSON.stringify(this.agent)
        },
        payload: payload
      });

      const response = await fetch(`${this.baseUrl}/user/v5/gec/correct/v3`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Grazie-Authenticate-JWT': this.token,
          'Grazie-Agent': JSON.stringify(this.agent)
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { rawResponse: errorText };
        }
        
        console.error('Grazie API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          errorData: errorData,
          rawResponse: errorText
        });
        
        throw new GrazieError(
          (errorData as any)?.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status.toString(),
          errorData
        );
      }

      // Return raw data from API - we'll parse the specific structure in the service implementation
      const data = await response.json();
      console.log('Grazie API Success Response Type:', typeof data);
      
      // Log some details about the structure without verbose output
      if (data && typeof data === 'object') {
        if ('corrections' in data && Array.isArray(data.corrections)) {
          console.log('Response has corrections array with length:', data.corrections.length);
        } else if (Array.isArray(data)) {
          console.log('Response is an array with length:', data.length);
        } else {
          console.log('Response keys:', Object.keys(data));
        }
      }
      
      return data;
    } catch (error) {
      if (error instanceof GrazieError) {
        throw error;
      }
      
      throw new GrazieError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'NETWORK_ERROR',
        error
      );
    }
  }

  /**
   * Correct a single sentence
   */
  async correctSentence(
    sentence: string,
    language: Language,
    services?: CorrectionServiceType[]
  ): Promise<SentenceWithProblems> {
    const results = await this.correctText([sentence], language, services);
    return results[0];
  }

  /**
   * Extract only the corrected text from the response
   */
  static extractCorrectedText(sentenceWithProblems: SentenceWithProblems): string {
    let correctedText = sentenceWithProblems.sentence;
    
    // Sort fixes by position (descending) to avoid offset issues when applying multiple fixes
    const allFixes = sentenceWithProblems.problems
      .flatMap(problem => problem.fixes)
      .filter(fix => fix.parts.some(part => 'range' in part && 'text' in part))
      .sort((a, b) => {
        const aChange = a.parts.find(part => 'range' in part) as any;
        const bChange = b.parts.find(part => 'range' in part) as any;
        return (bChange?.range?.start || 0) - (aChange?.range?.start || 0);
      });

    // Apply fixes from right to left to maintain text offsets
    for (const fix of allFixes) {
      for (const part of fix.parts) {
        if ('range' in part && 'text' in part) {
          const change = part as { range: { start: number; endExclusive: number }; text: string };
          correctedText = 
            correctedText.slice(0, change.range.start) + 
            change.text + 
            correctedText.slice(change.range.endExclusive);
        }
      }
    }
    
    return correctedText;
  }

  /**
   * Get a summary of detected problems
   */
  static getProblemSummary(sentenceWithProblems: SentenceWithProblems) {
    const problems = sentenceWithProblems.problems;
    
    return {
      totalProblems: problems.length,
      byCategory: problems.reduce((acc, problem) => {
        const category = problem.info.category;
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byService: problems.reduce((acc, problem) => {
        const service = problem.info.service;
        acc[service] = (acc[service] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byConfidence: problems.reduce((acc, problem) => {
        const confidence = problem.info.confidence;
        acc[confidence] = (acc[confidence] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}

// Custom error class for Grazie API errors
export class GrazieError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'GrazieError';
  }
}

// Factory function to create a Grazie client with environment token
export function createGrazieClient(config?: Partial<GrazieConfig>): GrazieClient {
  // Try to get token from config first, then environment (server-side only)
  const configToken = config?.token;
  const envToken = typeof window === 'undefined' ? process.env.GRAZIE_JWT_TOKEN : undefined;
  const token = configToken || envToken;
  
  if (!token) {
    throw new Error('GRAZIE_JWT_TOKEN must be provided in config or environment variable');
  }

  return new GrazieClient({
    ...config,
    token,
  });
}