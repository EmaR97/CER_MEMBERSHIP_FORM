export class ValidationError extends Error {
}

export class ParsingError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "ParsingError";
  }
}
