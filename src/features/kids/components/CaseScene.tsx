import {
  Candy,
  Cloud,
  Gamepad2,
  Heart,
  Highlighter,
  IceCreamCone,
  Lollipop,
  Smartphone,
  Sparkles,
  Store,
  Usb,
} from 'lucide-react'
import type { CaseVisual } from '../data/cases'

/** Ilustraciones de "evidencia" hechas con iconos: no reproducen marcas ni productos reales. */
export function CaseScene({ visual }: { visual: CaseVisual }) {
  switch (visual) {
    case 'flavors':
      return (
        <div className="scene scene--flavors">
          <div className="scene__box">
            <Candy />
            <span>Algodón de azúcar</span>
          </div>
          <div className="scene__box scene__box--tilt">
            <Lollipop />
            <span>Chicle</span>
          </div>
          <div className="scene__box">
            <IceCreamCone />
            <span>Mango con hielo</span>
          </div>
        </div>
      )
    case 'toy':
      return (
        <div className="scene scene--toy">
          <div className="scene__device scene__device--neon">
            <Sparkles />
          </div>
          <Gamepad2 className="scene__float" />
        </div>
      )
    case 'disguise':
      return (
        <div className="scene scene--disguise">
          <div className="scene__item">
            <Highlighter />
            <span>¿Marcatextos?</span>
          </div>
          <div className="scene__item">
            <Usb />
            <span>¿Memoria USB?</span>
          </div>
          <Cloud className="scene__puff" />
        </div>
      )
    case 'vapor':
      return (
        <div className="scene scene--vapor">
          <Cloud className="scene__cloud" />
          <p className="scene__bubble">“Es solo vapor de agua”</p>
        </div>
      )
    case 'feed':
      return (
        <div className="scene scene--feed">
          <div className="scene__phone">
            <Smartphone />
            <span className="scene__likes">
              <Heart /> 12 mil
            </span>
          </div>
          <Gamepad2 className="scene__float" />
        </div>
      )
    case 'store':
      return (
        <div className="scene scene--store">
          <Store className="scene__store" />
          <div className="scene__shelf">
            <Candy />
            <Lollipop />
            <span className="scene__mystery">?</span>
          </div>
        </div>
      )
  }
}
