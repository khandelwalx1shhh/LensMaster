import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { DefaultErrorPage, DefaultNotFoundPage } from "./components/site/ErrorStates";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Never surface provider/network internals; retry transient failures.
        retry: 1,
        staleTime: 5 * 60_000,
        gcTime: 30 * 60_000,
        refetchOnWindowFocus: false,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 60_000,
    defaultErrorComponent: DefaultErrorPage,
    defaultNotFoundComponent: DefaultNotFoundPage,
  });

  return router;
};
