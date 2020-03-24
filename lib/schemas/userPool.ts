const schema = [
    {
        attributeDataType: 'String',
        mutable: false,
        name: 'user_id'
    },
    {
        attributeDataType: 'String',
        mutable: false,
        name: 'name',
        required: true,
    },
    {
        attributeDataType: 'String',
        mutable: false,
        name: 'email',
        required: true,
    }
];

const clientWriteAttributes = [
    'name',
    'email',
    'custom:user_id',
];

const clientReadAttributes = [
    'name',
    'email',
    'custom:user_id',
];

export default {
    schema,
    clientReadAttributes,
    clientWriteAttributes,
}