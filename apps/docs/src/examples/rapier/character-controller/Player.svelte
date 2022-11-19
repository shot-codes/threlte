<script lang="ts">
	import { CharacterController } from '@threlte/rapier'
	import { useKeyboardControls } from 'svelte-kbc'

	const move = {
		x: 0,
		y: 0,
		z: 0
	}

	const { forward, backward, left, right } = useKeyboardControls()

	$: {
		move.x = 0
		move.y = 0
		move.z = 0

		if ($forward) move.z = -0.1
		if ($backward) move.z = 0.1
		if ($left) move.x = -0.1
		if ($right) move.x = 0.1
	}
</script>

<CharacterController
	{move}
	spawn={{
		x: 0,
		y: 1.4,
		z: 0
	}}
/>
