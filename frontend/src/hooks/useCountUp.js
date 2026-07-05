import { useEffect, useRef, useState } from 'react';

export default function useCountUp(valor, duracionMs = 600) {
  const [valorMostrado, setValorMostrado] = useState(valor || 0);
  const valorAnterior = useRef(valor || 0);

  useEffect(() => {
    const inicio = valorAnterior.current;
    const fin = valor || 0;
    if (inicio === fin) {
      setValorMostrado(fin);
      return undefined;
    }

    const inicioTiempo = performance.now();
    let frameId;

    function animar(ahora) {
      const progreso = Math.min((ahora - inicioTiempo) / duracionMs, 1);
      const easing = 1 - (1 - progreso) ** 3;
      setValorMostrado(inicio + (fin - inicio) * easing);
      if (progreso < 1) {
        frameId = requestAnimationFrame(animar);
      } else {
        valorAnterior.current = fin;
      }
    }

    frameId = requestAnimationFrame(animar);
    return () => cancelAnimationFrame(frameId);
  }, [valor, duracionMs]);

  return valorMostrado;
}
