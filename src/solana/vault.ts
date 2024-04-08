export type Vault = {
  "version": "0.1.0",
  "name": "vault",
  "constants": [
    {
      "name": "SEED",
      "type": "string",
      "value": "\"anchor\""
    }
  ],
  "instructions": [
    {
      "name": "create",
      "accounts": [
        {
          "name": "player",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "id",
          "type": "u64"
        },
        {
          "name": "stake",
          "type": "u64"
        },
        {
          "name": "time",
          "type": "u8"
        },
        {
          "name": "players",
          "type": {
            "vec": "publicKey"
          }
        },
        {
          "name": "validateKey",
          "type": "publicKey"
        },
        {
          "name": "withdrawKey",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "deposit",
      "accounts": [
        {
          "name": "player",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "stake",
          "type": "u64"
        }
      ]
    },
    {
      "name": "validate",
      "accounts": [
        {
          "name": "validateKey",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "player",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "withdraw",
      "accounts": [
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "close",
      "accounts": [
        {
          "name": "withdrawKey",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "owner",
          "type": "publicKey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "vault",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "players",
            "type": {
              "vec": "publicKey"
            }
          },
          {
            "name": "validateKey",
            "type": "publicKey"
          },
          {
            "name": "withdrawKey",
            "type": "publicKey"
          },
          {
            "name": "id",
            "type": "u64"
          },
          {
            "name": "stake",
            "type": "u64"
          },
          {
            "name": "time",
            "type": "u8"
          },
          {
            "name": "deposit",
            "type": {
              "vec": "bool"
            }
          },
          {
            "name": "balance",
            "type": "u64"
          },
          {
            "name": "counter",
            "type": "bytes"
          },
          {
            "name": "created",
            "type": "i64"
          },
          {
            "name": "started",
            "type": "i64"
          },
          {
            "name": "state",
            "type": {
              "defined": "State"
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "DepositError",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "IncorrectState"
          },
          {
            "name": "AlreadyDeposited"
          },
          {
            "name": "IncorrectDeposit"
          },
          {
            "name": "InvalidPlayer"
          }
        ]
      }
    },
    {
      "name": "ValidateError",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "UnregisteredValidateKey"
          },
          {
            "name": "ChallengeFinished"
          },
          {
            "name": "InvalidTime"
          },
          {
            "name": "IncorrectState"
          },
          {
            "name": "PlayerNotInVault"
          }
        ]
      }
    },
    {
      "name": "WithdrawError",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "WinNotFound"
          },
          {
            "name": "WithdrawAttemptTooEarly"
          },
          {
            "name": "PlayerAlreadyWithdrawn"
          },
          {
            "name": "PlayerNotInVault"
          },
          {
            "name": "InvalidSigner"
          }
        ]
      }
    },
    {
      "name": "CloseError",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "InvalidSigner"
          },
          {
            "name": "ChallengeOngoing"
          },
          {
            "name": "PendingWithdraws"
          }
        ]
      }
    },
    {
      "name": "State",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Pending"
          },
          {
            "name": "Ongoing"
          },
          {
            "name": "Finished"
          },
          {
            "name": "Canceled"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "MismatchSignerPlayer",
      "msg": "Signer and players[0] does not match"
    },
    {
      "code": 6001,
      "name": "StakeTooLow",
      "msg": "Stake must be greater to 0 SOL"
    },
    {
      "code": 6002,
      "name": "StakeTooHigh",
      "msg": "Stake must be smaller than 10 SOL"
    },
    {
      "code": 6003,
      "name": "TimeTooLow",
      "msg": "Challenge time must be at least 7 days"
    },
    {
      "code": 6004,
      "name": "TimeTooHigh",
      "msg": "Challenge time can't be more than 90 days"
    }
  ]
};

export const IDL: Vault = {
  "version": "0.1.0",
  "name": "vault",
  "constants": [
    {
      "name": "SEED",
      "type": "string",
      "value": "\"anchor\""
    }
  ],
  "instructions": [
    {
      "name": "create",
      "accounts": [
        {
          "name": "player",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "id",
          "type": "u64"
        },
        {
          "name": "stake",
          "type": "u64"
        },
        {
          "name": "time",
          "type": "u8"
        },
        {
          "name": "players",
          "type": {
            "vec": "publicKey"
          }
        },
        {
          "name": "validateKey",
          "type": "publicKey"
        },
        {
          "name": "withdrawKey",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "deposit",
      "accounts": [
        {
          "name": "player",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "stake",
          "type": "u64"
        }
      ]
    },
    {
      "name": "validate",
      "accounts": [
        {
          "name": "validateKey",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "player",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "withdraw",
      "accounts": [
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "close",
      "accounts": [
        {
          "name": "withdrawKey",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "owner",
          "type": "publicKey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "vault",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "players",
            "type": {
              "vec": "publicKey"
            }
          },
          {
            "name": "validateKey",
            "type": "publicKey"
          },
          {
            "name": "withdrawKey",
            "type": "publicKey"
          },
          {
            "name": "id",
            "type": "u64"
          },
          {
            "name": "stake",
            "type": "u64"
          },
          {
            "name": "time",
            "type": "u8"
          },
          {
            "name": "deposit",
            "type": {
              "vec": "bool"
            }
          },
          {
            "name": "balance",
            "type": "u64"
          },
          {
            "name": "counter",
            "type": "bytes"
          },
          {
            "name": "created",
            "type": "i64"
          },
          {
            "name": "started",
            "type": "i64"
          },
          {
            "name": "state",
            "type": {
              "defined": "State"
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "DepositError",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "IncorrectState"
          },
          {
            "name": "AlreadyDeposited"
          },
          {
            "name": "IncorrectDeposit"
          },
          {
            "name": "InvalidPlayer"
          }
        ]
      }
    },
    {
      "name": "ValidateError",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "UnregisteredValidateKey"
          },
          {
            "name": "ChallengeFinished"
          },
          {
            "name": "InvalidTime"
          },
          {
            "name": "IncorrectState"
          },
          {
            "name": "PlayerNotInVault"
          }
        ]
      }
    },
    {
      "name": "WithdrawError",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "WinNotFound"
          },
          {
            "name": "WithdrawAttemptTooEarly"
          },
          {
            "name": "PlayerAlreadyWithdrawn"
          },
          {
            "name": "PlayerNotInVault"
          },
          {
            "name": "InvalidSigner"
          }
        ]
      }
    },
    {
      "name": "CloseError",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "InvalidSigner"
          },
          {
            "name": "ChallengeOngoing"
          },
          {
            "name": "PendingWithdraws"
          }
        ]
      }
    },
    {
      "name": "State",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Pending"
          },
          {
            "name": "Ongoing"
          },
          {
            "name": "Finished"
          },
          {
            "name": "Canceled"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "MismatchSignerPlayer",
      "msg": "Signer and players[0] does not match"
    },
    {
      "code": 6001,
      "name": "StakeTooLow",
      "msg": "Stake must be greater to 0 SOL"
    },
    {
      "code": 6002,
      "name": "StakeTooHigh",
      "msg": "Stake must be smaller than 10 SOL"
    },
    {
      "code": 6003,
      "name": "TimeTooLow",
      "msg": "Challenge time must be at least 7 days"
    },
    {
      "code": 6004,
      "name": "TimeTooHigh",
      "msg": "Challenge time can't be more than 90 days"
    }
  ]
};
