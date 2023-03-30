# Level Elements

Level Elements can be any object that can be placed in the level. They are
designed to be used with the integrated level editor and can emit events
when the player interacts with them:

- `on:checkpointreached`
	- This event needs to be emitted from Elements that are used as checkpoints. Their name must start with "Checkpoint".
- `on:finishreached`
	- There can be many finish elements in the level. A finish is only reached when the player has reached all checkpoints before it.
