type EffectFunction = () => void | (() => void);

interface Effect extends EffectFunction {
    dependencies?: any[];
    cleanup?: () => void;
}

let pendingEffects: Function[] = [];

export const runEffects = () => {
    pendingEffects.forEach(effect => effect());
    pendingEffects = [];
}

export const useEffect = (effect: Effect, dependencies: any[]) => {
    const hasChanged = dependencies.some((dep, index) => dep !== (effect.dependencies?.[index]));

    if (hasChanged) {
        pendingEffects.push(() => {
            effect.cleanup?.();
            const cleanup = effect();
            if (typeof cleanup === 'function') {
                effect.cleanup = cleanup;
            }
            effect.dependencies = dependencies;
        });
    }
}
