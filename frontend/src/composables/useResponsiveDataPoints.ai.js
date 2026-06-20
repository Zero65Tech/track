import { onBeforeUnmount, onMounted, ref } from 'vue';

export function useResponsiveDataPoints({ initialValue, pixelsPerPoint, reservedWidth = 2 * 28 + 60 }) {
    let resizeObserver = null;

    const widgetContainer = ref(null);
    const numDataPoints = ref(initialValue);

    onMounted(() => {
        resizeObserver = new ResizeObserver(() => {
            if (!widgetContainer.value) {
                return;
            }

            numDataPoints.value = Math.round((widgetContainer.value.offsetWidth - reservedWidth) / pixelsPerPoint);
        });

        if (widgetContainer.value) {
            resizeObserver.observe(widgetContainer.value);
        }
    });

    onBeforeUnmount(() => {
        if (resizeObserver) {
            resizeObserver.disconnect();
        }
    });

    return {
        widgetContainer,
        numDataPoints
    };
}
