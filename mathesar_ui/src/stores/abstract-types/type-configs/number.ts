import type { FormValues } from '@mathesar-component-library/types';
import type { DbType } from '@mathesar/AppTypes';
import type { Column } from '@mathesar/stores/table-data/types';
import type {
  AbstractTypeConfigForm,
  AbstractTypeConfiguration,
  AbstractTypeDbConfig,
} from '../types';

const DB_TYPES = {
  DECIMAL: 'DECIMAL',
  NUMERIC: 'NUMERIC',
  INTEGER: 'INTEGER',
  SMALLINT: 'SMALLINT',
  BIGINT: 'BIGINT',
  REAL: 'REAL',
  DOUBLE_PRECISION: 'DOUBLE PRECISION',
};

const dbForm: AbstractTypeConfigForm = {
  variables: {
    numberType: {
      type: 'string',
      enum: ['Integer', 'Decimal', 'Float'],
      default: 'Decimal',
    },
    integerDataSize: {
      type: 'string',
      enum: ['default', 'bigInt', 'smallInt'],
      default: 'default',
    },
    decimalPlaces: {
      type: 'integer',
      default: null,
    },
    maxDigits: {
      type: 'integer',
      default: null,
    },
    floatingPointType: {
      type: 'string',
      enum: ['real', 'doublePrecision'],
      default: 'real',
    },
  },
  layout: {
    orientation: 'vertical',
    elements: [
      {
        type: 'input',
        variable: 'numberType',
        label: 'Number Type',
      },
      {
        type: 'switch',
        variable: 'numberType',
        cases: {
          Integer: [
            {
              type: 'input',
              variable: 'integerDataSize',
              label: 'Integer Data Size',
              interfaceType: 'select',
              options: {
                default: { label: 'Default (4 bytes)' },
                bigInt: { label: 'Big Integer (8 bytes)' },
                smallInt: { label: 'Small Integer (2 bytes)' },
              },
            },
          ],
          Decimal: [
            {
              type: 'layout',
              orientation: 'horizontal',
              elements: [
                {
                  type: 'input',
                  variable: 'decimalPlaces',
                  label: 'Decimal Places',
                },
                {
                  type: 'input',
                  variable: 'maxDigits',
                  label: 'Max Digits',
                },
              ],
            },
          ],
          Float: [
            {
              type: 'input',
              variable: 'floatingPointType',
              label: 'Floating Point Type',
              interfaceType: 'select',
              options: {
                real: { label: 'Real (6 digits)' },
                doublePrecision: {
                  label: 'Double Precision (15 digits)',
                },
              },
            },
          ],
        },
      },
    ],
  },
};

function determineDbType(dbFormValues: FormValues, columnType: DbType): DbType {
  switch (dbFormValues.numberType) {
    case 'Integer':
      switch (dbFormValues.integerDataSize) {
        case 'smallInt':
          return DB_TYPES.SMALLINT;
        case 'bigInt':
          return DB_TYPES.BIGINT;
        default:
          return DB_TYPES.INTEGER;
      }
    case 'Float':
      switch (dbFormValues.floatingPointType) {
        case 'real':
          return DB_TYPES.REAL;
        case 'doublePrecision':
        default:
          return DB_TYPES.DOUBLE_PRECISION;
      }
    case 'Decimal':
    default:
      return columnType === DB_TYPES.DECIMAL
        ? DB_TYPES.DECIMAL
        : DB_TYPES.NUMERIC;
  }
}

function determineDbTypeAndOptions(
  dbFormValues: FormValues,
  columnType: DbType,
): ReturnType<AbstractTypeDbConfig['determineDbTypeAndOptions']> {
  const dbType = determineDbType(dbFormValues, columnType);
  const typeOptions: Column['type_options'] = {};

  if (dbType === DB_TYPES.DECIMAL || dbType === DB_TYPES.NUMERIC) {
    if (dbFormValues.maxDigits !== null) {
      typeOptions.precision = dbFormValues.maxDigits;
    }
    if (dbFormValues.decimalPlaces !== null) {
      typeOptions.scale = dbFormValues.decimalPlaces;
    }
  }

  return {
    dbType,
    typeOptions,
  };
}

function constructDbFormValuesFromTypeOptions(
  columnType: DbType,
  typeOptions: Column['type_options'],
): FormValues {
  switch (columnType) {
    case DB_TYPES.SMALLINT:
      return {
        numberType: 'Integer',
        integerDataSize: 'smallInt',
      };
    case DB_TYPES.BIGINT:
      return {
        numberType: 'Integer',
        integerDataSize: 'bigInt',
      };
    case DB_TYPES.REAL:
      return {
        numberType: 'Float',
        floatingPointType: 'real',
      };
    case DB_TYPES.DOUBLE_PRECISION:
      return {
        numberType: 'Float',
        floatingPointType: 'doublePrecision',
      };
    case DB_TYPES.INTEGER:
      return {
        numberType: 'Integer',
        integerDataSize: 'default',
      };
    case DB_TYPES.DECIMAL:
    case DB_TYPES.NUMERIC:
    default:
      return {
        numberType: 'Decimal',
        maxDigits: (typeOptions?.precision as number) ?? null,
        decimalPlaces: (typeOptions?.scale as number) ?? null,
      };
  }
}

interface NumberDisplayOptions {
  show_as_percentage?: boolean | null;
  locale?: string | null;
}

const displayForm: AbstractTypeConfigForm = {
  variables: {
    showAsPercentage: {
      type: 'boolean',
      default: false,
    },
    format: {
      type: 'string',
      enum: ['none', 'af', 'ar-DZ', 'bg', 'bn', 'de-CH'],
      default: 'none',
    },
  },
  layout: {
    orientation: 'vertical',
    elements: [
      {
        type: 'input',
        variable: 'showAsPercentage',
        label: 'Show as Percentage',
      },
      {
        type: 'input',
        variable: 'format',
        label: 'Format',
        options: {
          none: { label: 'Use browser locale' },
          af: { label: '1,234,567.89' },
          'ar-DZ': { label: '1.234.567,89' },
          bg: { label: '1 234 567,89' },
          bn: { label: '12,34,567.89' },
          'de-CH': { label: "1'234'567.89" },
        },
      },
    ],
  },
};

function determineDisplayOptions(
  dispFormValues: FormValues,
): Column['display_options'] {
  const displayOptions: Column['display_options'] = {
    show_as_percentage: dispFormValues.showAsPercentage,
  };
  if (dispFormValues.format !== 'none') {
    displayOptions.locale = dispFormValues.format;
  }
  return displayOptions;
}

function constructDisplayFormValuesFromDisplayOptions(
  columnDisplayOpts: Column['display_options'],
): FormValues {
  const displayOptions = columnDisplayOpts as NumberDisplayOptions | null;
  const dispFormValues: FormValues = {
    showAsPercentage: displayOptions?.show_as_percentage ?? false,
    format: displayOptions?.locale ?? 'none',
  };
  return dispFormValues;
}

const numberType: AbstractTypeConfiguration = {
  icon: '#',
  input: {
    type: 'integer',
  },
  defaultDbType: DB_TYPES.NUMERIC,
  getDbConfig: () => ({
    form: dbForm,
    determineDbTypeAndOptions,
    constructDbFormValuesFromTypeOptions,
  }),
  getDisplayConfig: () => ({
    form: displayForm,
    determineDisplayOptions,
    constructDisplayFormValuesFromDisplayOptions,
  }),
};

export default numberType;
