/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumberish,
  BytesLike,
  FunctionFragment,
  Result,
  Interface,
  EventFragment,
  AddressLike,
  ContractRunner,
  ContractMethod,
  Listener,
} from "ethers";
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedLogDescription,
  TypedListener,
  TypedContractMethod,
} from "../common";

export declare namespace SilicaModelRegistry {
  export type ModelMetadataStruct = {
    id: BigNumberish;
    creator: AddressLike;
    name: string;
    description: string;
    modelType: string;
    version: string;
    storageURI: string;
    apiEndpoint: string;
    isActive: boolean;
    createdAt: BigNumberish;
    updatedAt: BigNumberish;
    usageCount: BigNumberish;
    feePerCall: BigNumberish;
  };

  export type ModelMetadataStructOutput = [
    id: bigint,
    creator: string,
    name: string,
    description: string,
    modelType: string,
    version: string,
    storageURI: string,
    apiEndpoint: string,
    isActive: boolean,
    createdAt: bigint,
    updatedAt: bigint,
    usageCount: bigint,
    feePerCall: bigint
  ] & {
    id: bigint;
    creator: string;
    name: string;
    description: string;
    modelType: string;
    version: string;
    storageURI: string;
    apiEndpoint: string;
    isActive: boolean;
    createdAt: bigint;
    updatedAt: bigint;
    usageCount: bigint;
    feePerCall: bigint;
  };
}

export interface SilicaModelRegistryInterface extends Interface {
  getFunction(
    nameOrSignature:
      | "ADMIN_ROLE"
      | "DEFAULT_ADMIN_ROLE"
      | "MODEL_CREATOR_ROLE"
      | "addModelCreator"
      | "creatorModels"
      | "getModel"
      | "getModelCount"
      | "getModelsByCreator"
      | "getRoleAdmin"
      | "grantRole"
      | "hasRole"
      | "modelNameExists"
      | "modelStats"
      | "models"
      | "recordModelUsage"
      | "registerModel"
      | "removeModelCreator"
      | "renounceRole"
      | "revokeRole"
      | "setModelStatus"
      | "supportsInterface"
      | "updateModel"
      | "updateModelFee"
  ): FunctionFragment;

  getEvent(
    nameOrSignatureOrTopic:
      | "FeeUpdated"
      | "ModelRegistered"
      | "ModelStatusChanged"
      | "ModelUpdated"
      | "ModelUsed"
      | "RoleAdminChanged"
      | "RoleGranted"
      | "RoleRevoked"
  ): EventFragment;

  encodeFunctionData(
    functionFragment: "ADMIN_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "DEFAULT_ADMIN_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "MODEL_CREATOR_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "addModelCreator",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "creatorModels",
    values: [AddressLike, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getModel",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getModelCount",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getModelsByCreator",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "getRoleAdmin",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "grantRole",
    values: [BytesLike, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "hasRole",
    values: [BytesLike, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "modelNameExists",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "modelStats",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "models",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "recordModelUsage",
    values: [BigNumberish, AddressLike, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "registerModel",
    values: [string, string, string, string, string, string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "removeModelCreator",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "renounceRole",
    values: [BytesLike, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "revokeRole",
    values: [BytesLike, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "setModelStatus",
    values: [BigNumberish, boolean]
  ): string;
  encodeFunctionData(
    functionFragment: "supportsInterface",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "updateModel",
    values: [BigNumberish, string, string, string]
  ): string;
  encodeFunctionData(
    functionFragment: "updateModelFee",
    values: [BigNumberish, BigNumberish]
  ): string;

  decodeFunctionResult(functionFragment: "ADMIN_ROLE", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "DEFAULT_ADMIN_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "MODEL_CREATOR_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "addModelCreator",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "creatorModels",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "getModel", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getModelCount",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getModelsByCreator",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getRoleAdmin",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "grantRole", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "hasRole", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "modelNameExists",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "modelStats", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "models", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "recordModelUsage",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "registerModel",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "removeModelCreator",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "renounceRole",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "revokeRole", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "setModelStatus",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "supportsInterface",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "updateModel",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "updateModelFee",
    data: BytesLike
  ): Result;
}

export namespace FeeUpdatedEvent {
  export type InputTuple = [modelId: BigNumberish, newFee: BigNumberish];
  export type OutputTuple = [modelId: bigint, newFee: bigint];
  export interface OutputObject {
    modelId: bigint;
    newFee: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace ModelRegisteredEvent {
  export type InputTuple = [
    modelId: BigNumberish,
    creator: AddressLike,
    name: string,
    modelType: string
  ];
  export type OutputTuple = [
    modelId: bigint,
    creator: string,
    name: string,
    modelType: string
  ];
  export interface OutputObject {
    modelId: bigint;
    creator: string;
    name: string;
    modelType: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace ModelStatusChangedEvent {
  export type InputTuple = [modelId: BigNumberish, isActive: boolean];
  export type OutputTuple = [modelId: bigint, isActive: boolean];
  export interface OutputObject {
    modelId: bigint;
    isActive: boolean;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace ModelUpdatedEvent {
  export type InputTuple = [
    modelId: BigNumberish,
    version: string,
    storageURI: string
  ];
  export type OutputTuple = [
    modelId: bigint,
    version: string,
    storageURI: string
  ];
  export interface OutputObject {
    modelId: bigint;
    version: string;
    storageURI: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace ModelUsedEvent {
  export type InputTuple = [
    modelId: BigNumberish,
    user: AddressLike,
    fee: BigNumberish
  ];
  export type OutputTuple = [modelId: bigint, user: string, fee: bigint];
  export interface OutputObject {
    modelId: bigint;
    user: string;
    fee: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace RoleAdminChangedEvent {
  export type InputTuple = [
    role: BytesLike,
    previousAdminRole: BytesLike,
    newAdminRole: BytesLike
  ];
  export type OutputTuple = [
    role: string,
    previousAdminRole: string,
    newAdminRole: string
  ];
  export interface OutputObject {
    role: string;
    previousAdminRole: string;
    newAdminRole: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace RoleGrantedEvent {
  export type InputTuple = [
    role: BytesLike,
    account: AddressLike,
    sender: AddressLike
  ];
  export type OutputTuple = [role: string, account: string, sender: string];
  export interface OutputObject {
    role: string;
    account: string;
    sender: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace RoleRevokedEvent {
  export type InputTuple = [
    role: BytesLike,
    account: AddressLike,
    sender: AddressLike
  ];
  export type OutputTuple = [role: string, account: string, sender: string];
  export interface OutputObject {
    role: string;
    account: string;
    sender: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export interface SilicaModelRegistry extends BaseContract {
  connect(runner?: ContractRunner | null): SilicaModelRegistry;
  waitForDeployment(): Promise<this>;

  interface: SilicaModelRegistryInterface;

  queryFilter<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;
  queryFilter<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;

  on<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  on<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  once<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  once<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  listeners<TCEvent extends TypedContractEvent>(
    event: TCEvent
  ): Promise<Array<TypedListener<TCEvent>>>;
  listeners(eventName?: string): Promise<Array<Listener>>;
  removeAllListeners<TCEvent extends TypedContractEvent>(
    event?: TCEvent
  ): Promise<this>;

  ADMIN_ROLE: TypedContractMethod<[], [string], "view">;

  DEFAULT_ADMIN_ROLE: TypedContractMethod<[], [string], "view">;

  MODEL_CREATOR_ROLE: TypedContractMethod<[], [string], "view">;

  addModelCreator: TypedContractMethod<
    [account: AddressLike],
    [void],
    "nonpayable"
  >;

  creatorModels: TypedContractMethod<
    [arg0: AddressLike, arg1: BigNumberish],
    [bigint],
    "view"
  >;

  getModel: TypedContractMethod<
    [modelId: BigNumberish],
    [SilicaModelRegistry.ModelMetadataStructOutput],
    "view"
  >;

  getModelCount: TypedContractMethod<[], [bigint], "view">;

  getModelsByCreator: TypedContractMethod<
    [creator: AddressLike],
    [bigint[]],
    "view"
  >;

  getRoleAdmin: TypedContractMethod<[role: BytesLike], [string], "view">;

  grantRole: TypedContractMethod<
    [role: BytesLike, account: AddressLike],
    [void],
    "nonpayable"
  >;

  hasRole: TypedContractMethod<
    [role: BytesLike, account: AddressLike],
    [boolean],
    "view"
  >;

  modelNameExists: TypedContractMethod<[arg0: string], [boolean], "view">;

  modelStats: TypedContractMethod<
    [arg0: BigNumberish],
    [
      [bigint, bigint, bigint] & {
        totalCalls: bigint;
        totalRevenue: bigint;
        lastUsedTimestamp: bigint;
      }
    ],
    "view"
  >;

  models: TypedContractMethod<
    [arg0: BigNumberish],
    [
      [
        bigint,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        boolean,
        bigint,
        bigint,
        bigint,
        bigint
      ] & {
        id: bigint;
        creator: string;
        name: string;
        description: string;
        modelType: string;
        version: string;
        storageURI: string;
        apiEndpoint: string;
        isActive: boolean;
        createdAt: bigint;
        updatedAt: bigint;
        usageCount: bigint;
        feePerCall: bigint;
      }
    ],
    "view"
  >;

  recordModelUsage: TypedContractMethod<
    [modelId: BigNumberish, user: AddressLike, _paymentToken: AddressLike],
    [void],
    "nonpayable"
  >;

  registerModel: TypedContractMethod<
    [
      name: string,
      description: string,
      modelType: string,
      version: string,
      storageURI: string,
      apiEndpoint: string,
      feePerCall: BigNumberish
    ],
    [bigint],
    "nonpayable"
  >;

  removeModelCreator: TypedContractMethod<
    [account: AddressLike],
    [void],
    "nonpayable"
  >;

  renounceRole: TypedContractMethod<
    [role: BytesLike, account: AddressLike],
    [void],
    "nonpayable"
  >;

  revokeRole: TypedContractMethod<
    [role: BytesLike, account: AddressLike],
    [void],
    "nonpayable"
  >;

  setModelStatus: TypedContractMethod<
    [modelId: BigNumberish, isActive: boolean],
    [void],
    "nonpayable"
  >;

  supportsInterface: TypedContractMethod<
    [interfaceId: BytesLike],
    [boolean],
    "view"
  >;

  updateModel: TypedContractMethod<
    [
      modelId: BigNumberish,
      version: string,
      storageURI: string,
      apiEndpoint: string
    ],
    [void],
    "nonpayable"
  >;

  updateModelFee: TypedContractMethod<
    [modelId: BigNumberish, newFee: BigNumberish],
    [void],
    "nonpayable"
  >;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "ADMIN_ROLE"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "DEFAULT_ADMIN_ROLE"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "MODEL_CREATOR_ROLE"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "addModelCreator"
  ): TypedContractMethod<[account: AddressLike], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "creatorModels"
  ): TypedContractMethod<
    [arg0: AddressLike, arg1: BigNumberish],
    [bigint],
    "view"
  >;
  getFunction(
    nameOrSignature: "getModel"
  ): TypedContractMethod<
    [modelId: BigNumberish],
    [SilicaModelRegistry.ModelMetadataStructOutput],
    "view"
  >;
  getFunction(
    nameOrSignature: "getModelCount"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "getModelsByCreator"
  ): TypedContractMethod<[creator: AddressLike], [bigint[]], "view">;
  getFunction(
    nameOrSignature: "getRoleAdmin"
  ): TypedContractMethod<[role: BytesLike], [string], "view">;
  getFunction(
    nameOrSignature: "grantRole"
  ): TypedContractMethod<
    [role: BytesLike, account: AddressLike],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "hasRole"
  ): TypedContractMethod<
    [role: BytesLike, account: AddressLike],
    [boolean],
    "view"
  >;
  getFunction(
    nameOrSignature: "modelNameExists"
  ): TypedContractMethod<[arg0: string], [boolean], "view">;
  getFunction(
    nameOrSignature: "modelStats"
  ): TypedContractMethod<
    [arg0: BigNumberish],
    [
      [bigint, bigint, bigint] & {
        totalCalls: bigint;
        totalRevenue: bigint;
        lastUsedTimestamp: bigint;
      }
    ],
    "view"
  >;
  getFunction(
    nameOrSignature: "models"
  ): TypedContractMethod<
    [arg0: BigNumberish],
    [
      [
        bigint,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        boolean,
        bigint,
        bigint,
        bigint,
        bigint
      ] & {
        id: bigint;
        creator: string;
        name: string;
        description: string;
        modelType: string;
        version: string;
        storageURI: string;
        apiEndpoint: string;
        isActive: boolean;
        createdAt: bigint;
        updatedAt: bigint;
        usageCount: bigint;
        feePerCall: bigint;
      }
    ],
    "view"
  >;
  getFunction(
    nameOrSignature: "recordModelUsage"
  ): TypedContractMethod<
    [modelId: BigNumberish, user: AddressLike, _paymentToken: AddressLike],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "registerModel"
  ): TypedContractMethod<
    [
      name: string,
      description: string,
      modelType: string,
      version: string,
      storageURI: string,
      apiEndpoint: string,
      feePerCall: BigNumberish
    ],
    [bigint],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "removeModelCreator"
  ): TypedContractMethod<[account: AddressLike], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "renounceRole"
  ): TypedContractMethod<
    [role: BytesLike, account: AddressLike],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "revokeRole"
  ): TypedContractMethod<
    [role: BytesLike, account: AddressLike],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "setModelStatus"
  ): TypedContractMethod<
    [modelId: BigNumberish, isActive: boolean],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "supportsInterface"
  ): TypedContractMethod<[interfaceId: BytesLike], [boolean], "view">;
  getFunction(
    nameOrSignature: "updateModel"
  ): TypedContractMethod<
    [
      modelId: BigNumberish,
      version: string,
      storageURI: string,
      apiEndpoint: string
    ],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "updateModelFee"
  ): TypedContractMethod<
    [modelId: BigNumberish, newFee: BigNumberish],
    [void],
    "nonpayable"
  >;

  getEvent(
    key: "FeeUpdated"
  ): TypedContractEvent<
    FeeUpdatedEvent.InputTuple,
    FeeUpdatedEvent.OutputTuple,
    FeeUpdatedEvent.OutputObject
  >;
  getEvent(
    key: "ModelRegistered"
  ): TypedContractEvent<
    ModelRegisteredEvent.InputTuple,
    ModelRegisteredEvent.OutputTuple,
    ModelRegisteredEvent.OutputObject
  >;
  getEvent(
    key: "ModelStatusChanged"
  ): TypedContractEvent<
    ModelStatusChangedEvent.InputTuple,
    ModelStatusChangedEvent.OutputTuple,
    ModelStatusChangedEvent.OutputObject
  >;
  getEvent(
    key: "ModelUpdated"
  ): TypedContractEvent<
    ModelUpdatedEvent.InputTuple,
    ModelUpdatedEvent.OutputTuple,
    ModelUpdatedEvent.OutputObject
  >;
  getEvent(
    key: "ModelUsed"
  ): TypedContractEvent<
    ModelUsedEvent.InputTuple,
    ModelUsedEvent.OutputTuple,
    ModelUsedEvent.OutputObject
  >;
  getEvent(
    key: "RoleAdminChanged"
  ): TypedContractEvent<
    RoleAdminChangedEvent.InputTuple,
    RoleAdminChangedEvent.OutputTuple,
    RoleAdminChangedEvent.OutputObject
  >;
  getEvent(
    key: "RoleGranted"
  ): TypedContractEvent<
    RoleGrantedEvent.InputTuple,
    RoleGrantedEvent.OutputTuple,
    RoleGrantedEvent.OutputObject
  >;
  getEvent(
    key: "RoleRevoked"
  ): TypedContractEvent<
    RoleRevokedEvent.InputTuple,
    RoleRevokedEvent.OutputTuple,
    RoleRevokedEvent.OutputObject
  >;

  filters: {
    "FeeUpdated(uint256,uint256)": TypedContractEvent<
      FeeUpdatedEvent.InputTuple,
      FeeUpdatedEvent.OutputTuple,
      FeeUpdatedEvent.OutputObject
    >;
    FeeUpdated: TypedContractEvent<
      FeeUpdatedEvent.InputTuple,
      FeeUpdatedEvent.OutputTuple,
      FeeUpdatedEvent.OutputObject
    >;

    "ModelRegistered(uint256,address,string,string)": TypedContractEvent<
      ModelRegisteredEvent.InputTuple,
      ModelRegisteredEvent.OutputTuple,
      ModelRegisteredEvent.OutputObject
    >;
    ModelRegistered: TypedContractEvent<
      ModelRegisteredEvent.InputTuple,
      ModelRegisteredEvent.OutputTuple,
      ModelRegisteredEvent.OutputObject
    >;

    "ModelStatusChanged(uint256,bool)": TypedContractEvent<
      ModelStatusChangedEvent.InputTuple,
      ModelStatusChangedEvent.OutputTuple,
      ModelStatusChangedEvent.OutputObject
    >;
    ModelStatusChanged: TypedContractEvent<
      ModelStatusChangedEvent.InputTuple,
      ModelStatusChangedEvent.OutputTuple,
      ModelStatusChangedEvent.OutputObject
    >;

    "ModelUpdated(uint256,string,string)": TypedContractEvent<
      ModelUpdatedEvent.InputTuple,
      ModelUpdatedEvent.OutputTuple,
      ModelUpdatedEvent.OutputObject
    >;
    ModelUpdated: TypedContractEvent<
      ModelUpdatedEvent.InputTuple,
      ModelUpdatedEvent.OutputTuple,
      ModelUpdatedEvent.OutputObject
    >;

    "ModelUsed(uint256,address,uint256)": TypedContractEvent<
      ModelUsedEvent.InputTuple,
      ModelUsedEvent.OutputTuple,
      ModelUsedEvent.OutputObject
    >;
    ModelUsed: TypedContractEvent<
      ModelUsedEvent.InputTuple,
      ModelUsedEvent.OutputTuple,
      ModelUsedEvent.OutputObject
    >;

    "RoleAdminChanged(bytes32,bytes32,bytes32)": TypedContractEvent<
      RoleAdminChangedEvent.InputTuple,
      RoleAdminChangedEvent.OutputTuple,
      RoleAdminChangedEvent.OutputObject
    >;
    RoleAdminChanged: TypedContractEvent<
      RoleAdminChangedEvent.InputTuple,
      RoleAdminChangedEvent.OutputTuple,
      RoleAdminChangedEvent.OutputObject
    >;

    "RoleGranted(bytes32,address,address)": TypedContractEvent<
      RoleGrantedEvent.InputTuple,
      RoleGrantedEvent.OutputTuple,
      RoleGrantedEvent.OutputObject
    >;
    RoleGranted: TypedContractEvent<
      RoleGrantedEvent.InputTuple,
      RoleGrantedEvent.OutputTuple,
      RoleGrantedEvent.OutputObject
    >;

    "RoleRevoked(bytes32,address,address)": TypedContractEvent<
      RoleRevokedEvent.InputTuple,
      RoleRevokedEvent.OutputTuple,
      RoleRevokedEvent.OutputObject
    >;
    RoleRevoked: TypedContractEvent<
      RoleRevokedEvent.InputTuple,
      RoleRevokedEvent.OutputTuple,
      RoleRevokedEvent.OutputObject
    >;
  };
}
