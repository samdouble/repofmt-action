import type { getOctokit } from '@actions/github';
import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';

export type Octokit = ReturnType<typeof getOctokit>;
export type Repository = RestEndpointMethodTypes['repos']['listForAuthenticatedUser']['response']['data'][number];
export type RepoContent = RestEndpointMethodTypes['repos']['getContent']['response']['data'];

export interface FileEntry {
  path: string;
  name: string;
  type: 'file' | 'dir';
}

export class RuleContext {
  private contentCache: Map<string, RepoContent> = new Map();
  private fileContentCache: Map<string, string> = new Map();
  private allFilesCache: FileEntry[] | null = null;

  constructor(
    public readonly octokit: Octokit,
    public readonly repository: Repository,
  ) {}

  async getContent(path: string = ''): Promise<RepoContent> {
    const cacheKey = `${this.repository.full_name}:${path}`;

    if (this.contentCache.has(cacheKey)) {
      return this.contentCache.get(cacheKey)!;
    }

    const { data: contents } = await this.octokit.rest.repos.getContent({
      owner: this.repository.owner.login,
      repo: this.repository.name,
      path,
    });

    this.contentCache.set(cacheKey, contents);
    return contents;
  }

  async getAllFiles(): Promise<FileEntry[]> {
    if (this.allFilesCache !== null) {
      return this.allFilesCache;
    }

    const files: FileEntry[] = [];
    const dirsToProcess: string[] = [''];

    while (dirsToProcess.length > 0) {
      const dir = dirsToProcess.pop()!;
      const contents = await this.getContent(dir);
      if (Array.isArray(contents)) {
        for (const item of contents) {
          const itemPath = dir ? `${dir}/${item.name}` : item.name;
          if (item.type === 'file') {
            files.push({ path: itemPath, name: item.name, type: 'file' });
          } else if (item.type === 'dir') {
            files.push({ path: itemPath, name: item.name, type: 'dir' });
            dirsToProcess.push(itemPath);
          }
        }
      }
    }

    this.allFilesCache = files;
    return files;
  }

  async getFileContent(path: string): Promise<string> {
    const cacheKey = `${this.repository.full_name}:file:${path}`;

    if (this.fileContentCache.has(cacheKey)) {
      return this.fileContentCache.get(cacheKey)!;
    }

    const content = await this.getContent(path);

    if (Array.isArray(content)) {
      throw new Error(`Path ${path} is a directory, not a file`);
    }

    if (content.type !== 'file' || !('content' in content)) {
      throw new Error(`Path ${path} is not a file`);
    }

    const decodedContent = Buffer.from(content.content, 'base64').toString('utf-8');
    this.fileContentCache.set(cacheKey, decodedContent);
    return decodedContent;
  }

  clearCache(): void {
    this.contentCache.clear();
    this.fileContentCache.clear();
    this.allFilesCache = null;
  }
}
