/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Contract,
  ContractFactory,
  ContractTransactionResponse,
  Interface,
} from "ethers";
import type {
  Signer,
  AddressLike,
  ContractDeployTransaction,
  ContractRunner,
} from "ethers";
import type { NonPayableOverrides } from "../../common";
import type {
  MockProtocol,
  MockProtocolInterface,
} from "../../contracts/MockProtocol";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_inputToken",
        type: "address",
      },
      {
        internalType: "address",
        name: "_outputToken",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Deposit",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Withdrawal",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "deposit",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "fund",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "getBalance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "inputToken",
    outputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "outputToken",
    outputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "withdraw",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const _bytecode =
  "0x608034608657601f61063738819003918201601f19168301916001600160401b03831184841017608b578084926040948552833981010312608657604b602060458360a1565b920160a1565b600080546001600160a01b039384166001600160a01b0319918216179091556001805492909316911617905560405161058290816100b58239f35b600080fd5b634e487b7160e01b600052604160045260246000fd5b51906001600160a01b038216820360865756fe608080604052600436101561001357600080fd5b60003560e01c90816301b60ef21461025a575080632e1a7d4d146101da5780637b1837de146101a6578063b6b55f2514610126578063c1d8d1d9146100fd5763f8b2cb4f1461006157600080fd5b346100e45760203660031901126100e457602460206001600160a01b0361008661027e565b16604051928380926370a0823160e01b82523060048301525afa80156100f1576000906100b9575b602090604051908152f35b506020813d6020116100e9575b816100d360209383610294565b810103126100e457602090516100ae565b600080fd5b3d91506100c6565b6040513d6000823e3d90fd5b346100e45760003660031901126100e4576001546040516001600160a01b039091168152602090f35b346100e45760203660031901126100e45760005460043590610156908290309033906001600160a01b03166102cc565b60015461016f90829033906001600160a01b0316610317565b6040519081527fe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c60203392a2602060405160018152f35b346100e45760403660031901126100e4576101d86101c261027e565b60243590309033906001600160a01b03166102cc565b005b346100e45760203660031901126100e4576001546004359061020a908290309033906001600160a01b03166102cc565b60005461022390829033906001600160a01b0316610317565b6040519081527f7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b6560203392a2602060405160018152f35b346100e45760003660031901126100e4576000546001600160a01b03168152602090f35b600435906001600160a01b03821682036100e457565b90601f8019910116810190811067ffffffffffffffff8211176102b657604052565b634e487b7160e01b600052604160045260246000fd5b6040516323b872dd60e01b60208201526001600160a01b03928316602482015292909116604483015260648083019390935291815261031591610310608483610294565b610352565b565b60405163a9059cbb60e01b60208201526001600160a01b03909216602483015260448083019390935291815261031591610310606483610294565b60018060a01b031660409160008084519261036d8685610294565b602084527f5361666545524332303a206c6f772d6c6576656c2063616c6c206661696c6564602085015260208151910182865af13d15610473573d9067ffffffffffffffff82116102b65784516103e39490926103d4601f8201601f191660200185610294565b83523d6000602085013e61047c565b8051908115918215610450575b5050156103fa5750565b5162461bcd60e51b815260206004820152602a60248201527f5361666545524332303a204552433230206f7065726174696f6e20646964206e6044820152691bdd081cdd58d8d9595960b21b6064820152608490fd5b81925090602091810103126100e4576020015180151581036100e45738806103f0565b916103e3926060915b919290156104de5750815115610490575090565b3b156104995790565b60405162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e74726163740000006044820152606490fd5b8251909150156104f15750805190602001fd5b6040519062461bcd60e51b8252602060048301528181519182602483015260005b8381106105345750508160006044809484010152601f80199101168101030190fd5b6020828201810151604487840101528593500161051256fea2646970667358221220aa90fdbf277fc4ef9e14ee6efd97c7e51b51ab223126750f30e6e375473012dd64736f6c634300081c0033";

type MockProtocolConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: MockProtocolConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class MockProtocol__factory extends ContractFactory {
  constructor(...args: MockProtocolConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override getDeployTransaction(
    _inputToken: AddressLike,
    _outputToken: AddressLike,
    overrides?: NonPayableOverrides & { from?: string }
  ): Promise<ContractDeployTransaction> {
    return super.getDeployTransaction(
      _inputToken,
      _outputToken,
      overrides || {}
    );
  }
  override deploy(
    _inputToken: AddressLike,
    _outputToken: AddressLike,
    overrides?: NonPayableOverrides & { from?: string }
  ) {
    return super.deploy(_inputToken, _outputToken, overrides || {}) as Promise<
      MockProtocol & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(runner: ContractRunner | null): MockProtocol__factory {
    return super.connect(runner) as MockProtocol__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): MockProtocolInterface {
    return new Interface(_abi) as MockProtocolInterface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): MockProtocol {
    return new Contract(address, _abi, runner) as unknown as MockProtocol;
  }
}
