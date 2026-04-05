import {
  AfterViewInit,
  Directive,
  ElementRef,
  NgZone,
  OnDestroy,
  inject,
  input,
  output,
} from '@angular/core';

@Directive({
  selector: '[appIntersect]',
})
export class IntersectDirective implements AfterViewInit, OnDestroy {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);
  private observer?: IntersectionObserver;
  private isInsideViewport = false;

  threshold = input<number | number[]>(0.1);
  rootMargin = input('0px');
  once = input(false);

  intersect = output<IntersectionObserverEntry>();

  // Inicia o observer quando o elemento ja existe no DOM.
  ngAfterViewInit(): void {
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    // O observer roda fora da zona para evitar ciclos de deteccao desnecessarios.
    this.zone.runOutsideAngular(() => {
      this.observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry) {
            return;
          }

          if (!entry.isIntersecting) {
            this.isInsideViewport = false;
            return;
          }

          if (this.isInsideViewport) {
            return;
          }

          this.isInsideViewport = true;

          // Volta para a zona apenas na hora de emitir o evento para o template.
          this.zone.run(() => this.intersect.emit(entry));

          // Se for configurado para disparar uma unica vez, desconecta apos o primeiro match.
          if (this.once()) {
            this.observer?.disconnect();
          }
        },
        {
          threshold: this.threshold(),
          rootMargin: this.rootMargin(),
        },
      );

      this.observer.observe(this.elementRef.nativeElement);
    });
  }

  // Garante limpeza do observer para evitar vazamento de memoria.
  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
