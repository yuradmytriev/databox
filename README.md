# DataBox

![DataRoom Demo](./records/demo.gif)

So here's what I built for this demo:

## The Core Data Structure

First challenge was figuring out the right way to handle file/folder operations without the usual tree recursion headaches. Went with a normalized graph structure - basically all files and folders live in a flat object and we just track relationships with IDs.

Why this works better:
- Lookups are O(1) instead of having to traverse the whole tree
- Way easier to serialize for storage
- No circular reference issues
- Move operations are just updating a few pointers

Here's what it looks like:

```typescript
// Normalized graph
{
  nodes: {
    "folder-1": {
      id: "folder-1",
      name: "Documents",
      type: "folder",
      parentId: null,
      childrenIds: ["folder-2", "file-1"]
    },
    "folder-2": {
      id: "folder-2",
      name: "Work",
      type: "folder",
      parentId: "folder-1",
      childrenIds: ["file-2"]
    },
    "file-1": {
      id: "file-1",
      name: "report.pdf",
      type: "file",
      parentId: "folder-1",
      size: 1024,
      content: Blob
    }
  },
  rootIds: ["folder-1"]
}
```

Moving a file? Just update its `parentId` and the parent's `childrenIds` array. No tree traversal needed.

## Storage Layer

Picked IndexedDB for local storage. It's kinda painful to work with directly so I'm using Dexie.js as a wrapper.

Built the data layer with dependency injection so we can swap it out later if needed (like moving to a real backend). IndexedDB also has some nice permission features built in which pairs well with auth - important for an MVP.

## React Setup

Using React Query to connect everything. It handles all the loading states and cache invalidation which saves a ton of boilerplate.

## PDF Rendering

PDFs can get pretty heavy so I'm using pdf.js with a web worker to keep rendering off the main thread. Otherwise large files would freeze the UI.

## Auth

Was gonna use Clerk initially but didn't want the vendor lock-in. Set up OIDC instead with some mocks for dev - more flexible if we need to switch providers later.

## Error Handling

Built a simple Logger class as a facade - makes it easy to plug in Sentry or New Relic down the road without touching every error call.

## State

Went with Zustand for state management. Way simpler than Redux and not as magical as MobX.

## What's Actually Working

Main focus was getting the data layer right, so skipped some UI stuff like permissions, sharing, and activity logs for now.

Current features:
- Create files/folders (buttons or drag-and-drop)
- Move stuff between folders and data rooms
- Error handling for broken files or size limits (added some test PDFs to break things)
- Breadcrumb navigation (tree view would be better but ran out of time)
- Recent files panel - nice for switching between docs quickly, similar to macOS

## What's Missing / TODO

- Permissions & file sharing (pretty important lol)
- Tree view sidebar for navigation
- Real auth provider integration
- Proper error monitoring setup
- Undo/redo keyboard shortcuts (Cmd+Z)
- Configurable undo timeout
