import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class RolesGuard implements CanActivate {
  public constructor(public access: IAccess | string[] | string) {}

  private get forbiddenException(): HttpException {
    return new ForbiddenException('Permission denied');
  }

  public canActivate(context: ExecutionContext): boolean {
    if (!this.access) {
      return true;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const req: any = context.switchToHttp().getRequest();
    const { user, query } = req;

    const role: string = user.position;

    let hasPermission = false;

    if (typeof this.access === 'string') {
      if (this.access !== role) {
        throw this.forbiddenException;
      }
      return true;
    }
    if (Array.isArray(this.access)) {
      if (!this.access.includes(role)) {
        throw this.forbiddenException;
      }
      return true;
    }
    for (const accessRole in this.access) {
      if (role === accessRole) {
        hasPermission = true;
        const userQuery: string[] = query ? Object.keys(query) : [];
        const permission: string[] = this.access[accessRole];
        userQuery.forEach((itemQuery: string) => {
          if (!permission.includes(itemQuery) && permission.length > 0) {
            hasPermission = false;
          }
        });
      }
    }

    if (!hasPermission) {
      throw this.forbiddenException;
    }

    return true;
  }
}

export interface IAccess {
  [key: string]: string[];
}
