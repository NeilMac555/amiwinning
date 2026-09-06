"use client";

/** Pure presentation: never mounts account actions or reads/writes bet data. */
export function DashboardLoading({ failed = false }: { failed?: boolean }) {
  return (
    <main className="dashboard-loading" aria-busy={!failed}>
      <aside className="dashboard-loading-sidebar" aria-hidden="true">
        <div className="dashboard-loading-brand">Am I Up</div>
        {[0, 1, 2, 3, 4].map((item) => (
          <div key={item} className="dashboard-loading-line" />
        ))}
      </aside>
      <div className="dashboard-loading-main">
        <div className="dashboard-loading-top" aria-hidden="true">Am I Up</div>
        <div className="dashboard-loading-body">
          <h1>Dashboard</h1>
          <p role={failed ? "alert" : "status"}>
            {failed ? "Your account couldn’t load. Please try again." : "Loading your account…"}
          </p>
          {failed ? (
            <button className="btn-primary" onClick={() => window.location.reload()}>
              Try again
            </button>
          ) : (
            <div className="dashboard-loading-blocks" aria-hidden="true">
              <div className="dashboard-loading-paste" />
              <div className="dashboard-loading-kpis">
                {[0, 1, 2, 3].map((item) => <div key={item} />)}
              </div>
              <div className="dashboard-loading-chart" />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
