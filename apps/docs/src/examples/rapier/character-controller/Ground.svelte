<script lang="ts">
	import { Mesh } from '@threlte/core'
	import { AutoColliders } from '@threlte/rapier'
	import { BoxGeometry, MeshStandardMaterial } from 'three'
	import { DEG2RAD } from 'three/src/math/MathUtils'
</script>

<AutoColliders shape={'cuboid'} position={{ y: -0.5 }}>
	<Mesh
		receiveShadow
		position={{ y: -0.7 }}
		rotation={{ z: 25 * DEG2RAD }}
		geometry={new BoxGeometry(10, 1, 10)}
		material={new MeshStandardMaterial()}
	/>

	<Mesh
		receiveShadow
		position={{ y: -3 }}
		geometry={new BoxGeometry(20, 1, 20)}
		material={new MeshStandardMaterial()}
	/>
</AutoColliders>
