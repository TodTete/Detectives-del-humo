import { Bird, Cat, Rabbit, Turtle, type LucideIcon } from 'lucide-react'
import type { AvatarId } from '../data/cases'

export const AVATAR_ICONS: Record<AvatarId, LucideIcon> = {
  gato: Cat,
  buho: Bird,
  conejo: Rabbit,
  tortuga: Turtle,
}
