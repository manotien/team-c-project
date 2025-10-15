import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import type {
  AppControllerRoute,
  AppViewRoute,
  BullBoardQueues,
  ControllerHandlerReturnType,
  IServerAdapter,
  UIConfig,
} from "@bull-board/api/typings/app";

export class NextJsAdapter implements IServerAdapter {
  private basePath = "";
  private bullBoardQueues: BullBoardQueues | undefined;
  private errorHandler:
    | ((error: Error) => ControllerHandlerReturnType)
    | undefined;
  private apiRoutes: AppControllerRoute[] = [];
  private entryRoute: AppViewRoute | undefined;
  private statics: { path: string; route: string } | undefined;
  private viewPath = "";
  private uiConfig: UIConfig = {};

  public setBasePath(path: string): this {
    this.basePath = path;
    return this;
  }

  public setQueues(bullBoardQueues: BullBoardQueues): this {
    this.bullBoardQueues = bullBoardQueues;
    return this;
  }

  public setViewsPath(viewPath: string): this {
    this.viewPath = viewPath;
    return this;
  }

  public setStaticPath(staticsRoute: string, staticsPath: string): this {
    this.statics = { route: staticsRoute, path: staticsPath };
    return this;
  }

  public setEntryRoute(route: AppViewRoute): this {
    this.entryRoute = route;
    return this;
  }

  public setErrorHandler(
    handler: (error: Error) => ControllerHandlerReturnType
  ): this {
    this.errorHandler = handler;
    return this;
  }

  public setApiRoutes(routes: AppControllerRoute[]): this {
    this.apiRoutes = routes;
    return this;
  }

  public setUIConfig(config: UIConfig = {}): this {
    this.uiConfig = config;
    return this;
  }

  public async handleRequest(
    request: NextRequest,
    params: { path?: string[] }
  ): Promise<NextResponse> {
    const { path = [] } = params;
    const pathname = "/" + path.join("/");
    const method = request.method.toLowerCase() as
      | "get"
      | "post"
      | "put"
      | "patch";

    try {
      // Handle static files
      if (this.statics && pathname.startsWith(this.statics.route)) {
        return this.serveStatic(pathname);
      }

      // Handle API routes
      for (const route of this.apiRoutes) {
        const methods = Array.isArray(route.method)
          ? route.method
          : [route.method];
        const routes = Array.isArray(route.route) ? route.route : [route.route];

        for (const routePath of routes) {
          const match = this.matchRoute(pathname, routePath);
          if (match && methods.includes(method)) {
            const body =
              method !== "get" && request.body
                ? await request.json().catch(() => ({}))
                : {};

            const result = await route.handler({
              queues: this.bullBoardQueues!,
              params: match.params,
              query: Object.fromEntries(request.nextUrl.searchParams),
              body,
              headers: Object.fromEntries(request.headers),
            });

            return NextResponse.json(result.body, {
              status: result.status || 200,
            });
          }
        }
      }

      // Handle entry point (main UI)
      if (this.entryRoute && pathname === "/") {
        const view = this.entryRoute.handler({
          basePath: this.basePath,
          uiConfig: this.uiConfig,
        });
        return this.renderView(view.name, view.params);
      }

      return NextResponse.json({ error: "Not found" }, { status: 404 });
    } catch (error) {
      if (this.errorHandler && error instanceof Error) {
        const result = this.errorHandler(error);
        return NextResponse.json(result.body, {
          status: result.status || 500,
        });
      }
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }

  private matchRoute(
    pathname: string,
    routePattern: string
  ): { params: Record<string, string> } | null {
    // Normalize paths - remove leading/trailing slashes
    const normalizePath = (path: string) =>
      path.split("/").filter(Boolean);

    const pathParts = normalizePath(pathname);
    const routeParts = normalizePath(routePattern);

    // For root route
    if (routePattern === "/" && pathname === "/") {
      return { params: {} };
    }

    // If lengths don't match, no match
    if (pathParts.length !== routeParts.length) {
      return null;
    }

    const params: Record<string, string> = {};

    for (let i = 0; i < routeParts.length; i++) {
      const routePart = routeParts[i];
      const pathPart = pathParts[i];

      if (routePart.startsWith(":")) {
        const paramName = routePart.slice(1);
        params[paramName] = decodeURIComponent(pathPart);
      } else if (routePart !== pathPart) {
        return null;
      }
    }

    return { params };
  }

  private serveStatic(pathname: string): NextResponse {
    if (!this.statics) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const relativePath = pathname.replace(this.statics.route, "");
    const filePath = join(this.statics.path, relativePath);

    try {
      const content = readFileSync(filePath);
      const contentType = this.getContentType(filePath);

      return new NextResponse(content, {
        headers: {
          "Content-Type": contentType,
        },
      });
    } catch {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  private renderView(
    viewName: string,
    params: Record<string, string>
  ): NextResponse {
    try {
      // viewName might already include .ejs extension
      const fileName = viewName.endsWith(".ejs") ? viewName : `${viewName}.ejs`;
      const viewPath = join(this.viewPath, fileName);
      let template = readFileSync(viewPath, "utf-8");

      // Simple EJS template replacement
      // Replace <%= variable %> with escaped value
      template = template.replace(/<%=\s*(\w+)\s*%>/g, (_, key) => {
        const value = params[key] || "";
        // HTML escape for security
        return value
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      });

      // Replace <%- variable %> with unescaped value (for JSON)
      template = template.replace(/<%-(.*?)%>/g, (_, key) => {
        return params[key.trim()] || "";
      });

      return new NextResponse(template, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    } catch (error) {
      console.error("View rendering error:", error);
      return NextResponse.json(
        {
          error: "View not found",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 404 }
      );
    }
  }

  private getContentType(filePath: string): string {
    const ext = filePath.split(".").pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      js: "application/javascript",
      css: "text/css",
      html: "text/html",
      json: "application/json",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      svg: "image/svg+xml",
      ico: "image/x-icon",
      woff: "font/woff",
      woff2: "font/woff2",
      ttf: "font/ttf",
      eot: "application/vnd.ms-fontobject",
    };
    return contentTypes[ext || ""] || "application/octet-stream";
  }
}
