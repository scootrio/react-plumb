export const genid = () => '' + Math.floor(Math.random() * 10000);

const sourceEndpoint = () => ({
  connector: 'Flowchart',
  anchor: 'Right',
  isSource: true,
  uuid: genid()
});

const targetEndpoint = () => ({
  connector: 'Flowchart',
  anchor: 'Left',
  isTarget: true,
  uuid: genid()
});

const endpoints = () => [targetEndpoint(), sourceEndpoint()];

const connectionSource = sourceEndpoint();

const connectionTarget = targetEndpoint();

const initialState = {
  nodes: [
    {
      id: '1',
      x: 500,
      y: 500,
      endpoints: [targetEndpoint(), connectionSource]
    },
    {
      id: '2',
      x: 600,
      y: 600,
      endpoints: [connectionTarget, sourceEndpoint()]
    },
    {
      id: genid(),
      x: 100,
      y: 400,
      endpoints: endpoints()
    },
    {
      id: genid(),
      x: 400,
      y: 100,
      endpoints: endpoints()
    },
    {
      id: genid(),
      x: 400,
      y: 400,
      endpoints: endpoints()
    }
  ],
  connections: [
    {
      id: 'conn-1',
      source: {
        id: '1',
        endpoint: connectionSource.uuid
      },
      target: {
        id: '2',
        endpoint: connectionTarget.uuid
      }
    }
  ]
};

export default initialState;
