import { createApp, defineComponent, h } from "vue";
import { VueQueryPlugin } from "@tanstack/vue-query";

type InstanceType<V> = V extends { new (...arg: any[]): infer X } ? X : never;
type VM<V> = InstanceType<V> & { unmount: () => void };

export function renderHook<TResult>(setup: () => TResult): {
  result: TResult;
  rerender: () => void;
  unmount: () => void;
} {
  let result!: TResult;

  const Comp = defineComponent({
    setup() {
      result = setup();
      return () => h("div");
    },
  });

  const mounted = mount(Comp);

  const rerender = () => {
    mounted.unmount();
    mount(Comp);
  };

  return {
    result,
    rerender,
    unmount: mounted.unmount,
  } as { result: TResult; rerender: () => void; unmount: () => void };
}

const vueQueryPoluginOptions = {
  queryClientConfig: {
    defaultOptions: {
      queries: {
        retry: 0,
      },
    },
  },
};

function mount<V>(Comp: V) {
  const el = document.createElement("div");
  const app = createApp(Comp as any);
  app.use(VueQueryPlugin, vueQueryPoluginOptions);
  const unmount = () => app.unmount();
  const comp = app.mount(el) as any as VM<V>;
  comp.unmount = unmount;

  return comp;
}
