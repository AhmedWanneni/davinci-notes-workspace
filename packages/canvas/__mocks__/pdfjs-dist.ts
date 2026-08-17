const noop = () => {};

class MockPDFDocumentProxy {
  numPages = 0;
  destroy = async () => {};
  getPage = async () => ({
    getViewport: () => ({ width: 612, height: 792 }),
    render: () => ({ promise: Promise.resolve(), cancel: noop }),
  });
}

export const GlobalWorkerOptions = {
  workerSrc: "",
};

export function getDocument() {
  return {
    promise: Promise.resolve(new MockPDFDocumentProxy()),
    onProgress: undefined,
    destroy: noop,
  };
}

export const version = "mock";
export default {
  GlobalWorkerOptions,
  getDocument,
  version,
};
