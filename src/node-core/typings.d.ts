export interface IShellError extends Error {
  ip?: string;
  tag?: string;
  stdout?: string;
  stderr?: string;
  info?: string;
  code?: number;
}
