export interface MuxPlayerPlugin {
  echo(options: { value: string }): Promise<{ value: string }>;
}
