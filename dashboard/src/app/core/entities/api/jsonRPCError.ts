export class JsonRPCError extends Error {
  code: string;
  data: any;
  errorMessage: string;

  constructor(serverResponse?: any) {
    super(serverResponse.message);
    this.code = serverResponse.code;
  }
}
