declare module 'tinytime' {
  function tinytime (template: string, options?: any): {render: (date: Date) => string}
  export = tinytime
}
