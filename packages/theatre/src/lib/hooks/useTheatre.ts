import { getContext } from 'svelte'
import type { TheatreContext } from '../types/types'

export const useTheatre = (): TheatreContext => {
  const theatreContext = getContext<TheatreContext>('theatre-context')
  if (!theatreContext)
    throw new Error('Theatre context not found, did you forget to wrap your app in <Theatre>?')
  return theatreContext
}
