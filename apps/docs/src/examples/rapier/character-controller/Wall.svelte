<script lang="ts">
	import { T } from '@threlte/core'
	import { AutoColliders } from '@threlte/rapier'
	import { MeshStandardMaterial } from 'three'
	import { BoxGeometry } from 'three'
</script>

<AutoColliders>
	<T.Mesh
		position.x={10}
		geometry={new BoxGeometry(1, 5, 1)}
		material={new MeshStandardMaterial()}
	/>
</AutoColliders>
