import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { getFact } from "./hooks/queries";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function Fact() {
  const fact = getFact({
    params: {
      query: { max_length: 500 },
    },
  });

  return (
    <div>
      {fact.isLoading && <div>Loading...</div>}
      {fact.error ? (
        <div>There was an error: {fact.error.message}</div>
      ) : (
        <pre>
          <code>{JSON.stringify(fact.data, undefined, 2)}</code>
        </pre>
      )}
      <button type="button" onClick={() => fact.refetch()}>
        Another fact!
      </button>
    </div>
  );
}

function App() {
  const [reactQueryClient] = useState(
    new QueryClient({
      defaultOptions: {
        queries: {
          networkMode: "offlineFirst", // keep caches as long as possible
          refetchOnWindowFocus: false, // don’t refetch on window focus
        },
      },
    })
  );
  return (
    <QueryClientProvider client={reactQueryClient}>
      <Fact />
    </QueryClientProvider>
  );
}

const domNode = document.getElementById("app");
if (domNode) {
  const root = createRoot(domNode);
  root.render(<App />);
}
