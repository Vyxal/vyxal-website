import {
  ComponentContainer,
  ContentItem,
  GoldenLayout,
  LayoutConfig,
} from "golden-layout";
import { onMounted, ref, shallowRef } from "vue";
import { useMainStore } from "@/stores/MainStore";

export const isClient = typeof window !== "undefined";
export const isDocumentReady = () =>
  isClient && document.readyState === "complete" && document.body != null;

export function useDocumentReady(func: () => void) {
  onMounted(() => {
    console.log(isDocumentReady());
    if (isDocumentReady()) func();
    else
      document.addEventListener(
        "readystatechange",
        () => isDocumentReady() && func(),
        {
          passive: true,
        }
      );
  });
}

export function useGoldenLayout(
  createComponent: (
    type: string,
    container: HTMLElement
  ) => ComponentContainer.Component,
  destroyComponent: (container: HTMLElement) => void,
  config?: LayoutConfig
) {
  const element = shallowRef<HTMLElement | null>(null);
  const layout = shallowRef<GoldenLayout | null>(null);
  const initialized = ref(false);

  useDocumentReady(() => {
    if (element.value == null) throw new Error("Element must be set.");
    const goldenLayout = new GoldenLayout(element.value);
    goldenLayout.resizeWithContainerAutomatically = true;


    goldenLayout.bindComponentEvent = (container, itemConfig) => {
      const { componentType } = itemConfig;
      if (typeof componentType !== "string")
        throw new Error("Invalid component type.");
      const component = createComponent(componentType, container.element);
      return {
        component,
        virtual: false,
      };
    };
    goldenLayout.unbindComponentEvent = (container) => {
      destroyComponent(container.element);
    };


    if (config != null) goldenLayout.loadLayout(config);

    // https://github.com/microsoft/TypeScript/issues/34933
    layout.value = goldenLayout as any;

    initialized.value = true;
    const store = useMainStore();
    store.save(layout);
  });

  const focusOutput = () => {
    function temp(item: ContentItem | undefined) {
      if ((item as any)?.componentName === "Output") {
        (item as any)?.focus?.();
      }
      item?.contentItems?.forEach(temp);
    }

    temp(layout.value?.rootItem);
  };

  return { element, initialized, layout, focusOutput };
}
