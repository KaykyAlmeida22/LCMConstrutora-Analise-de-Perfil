const API_BASE_URL = 'https://apicpf.com/api/consulta';
const API_KEY = import.meta.env.VITE_CPF_API_KEY || 'e6b317710527e7548205914b2370e61e92b6d0164803ec5d78ae6e432d2f12e7';

export interface CPFResponse {
  code: number;
  data?: {
    cpf: string;
    nome: string;
    genero: string;
    data_nascimento: string;
  };
  message?: string;
}

export const cpfService = {
  async consultaCPF(cpf: string): Promise<CPFResponse> {
    const cleanCpf = cpf.replace(/\D/g, '');
    
    if (cleanCpf.length !== 11) {
      return { code: 400, message: 'CPF deve conter 11 dígitos' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}?cpf=${cleanCpf}&api_key=${API_KEY}`);
      const data = await response.json();
      return data as CPFResponse;
    } catch (error) {
      console.error('Erro na consulta de CPF:', error);
      return { code: 500, message: 'Erro ao conectar com o serviço de consulta de CPF' };
    }
  }
};
