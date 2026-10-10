import type { PluginViewEvent, PluginViewModel } from "@app/plugin-api";

interface PluginViewModelRendererProps {
  model: PluginViewModel;
  onEvent: (event: PluginViewEvent) => void;
}

export function PluginViewModelRenderer({ model, onEvent }: PluginViewModelRendererProps) {
  switch (model.type) {
    case "stack":
      return <div data-plugin-view-node="stack">{model.children.map((child, index) => (
        <PluginViewModelRenderer key={`${child.type}-${index}`} model={child} onEvent={onEvent} />
      ))}</div>;
    case "text":
      return <p data-plugin-view-node="text">{model.text}</p>;
    case "button":
      return <button data-plugin-view-node="button" disabled={model.disabled} onClick={() => onEvent({ type: "click", targetId: model.id })}>{model.label}</button>;
    case "input":
      return <input data-plugin-view-node="input" value={model.value} placeholder={model.placeholder} onChange={(event) => onEvent({ type: "input", targetId: model.id, value: event.target.value })} />;
  }
}
