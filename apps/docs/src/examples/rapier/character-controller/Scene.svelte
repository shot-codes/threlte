<script lang="ts">
	import {
		AudioListener,
		DirectionalLight,
		Object3DInstance,
		OrbitControls,
		PerspectiveCamera
	} from '@threlte/core'
	import { GridHelper } from 'three'
	import Ground from './Ground.svelte'
	import Player from './Player.svelte'
	import Wall from './Wall.svelte'
</script>

<PerspectiveCamera position={{ y: 10, z: 10, x: 10 }}>
	<OrbitControls />
</PerspectiveCamera>

<DirectionalLight shadow position={{ y: 20, x: 8, z: -3 }} />

<Object3DInstance object={new GridHelper(50)} />

<Ground />

<Player />

<Wall />
