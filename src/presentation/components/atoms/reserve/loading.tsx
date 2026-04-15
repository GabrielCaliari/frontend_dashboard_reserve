export function Loading() {
  return (
    <>
      <div className="loader">
        <div className="play-icon">
          <img src="/loading.png" className="w-8" alt="loading" />
        </div>
        <div className="spinner spinner-inner"></div>
      </div>
    </>
  );
}
