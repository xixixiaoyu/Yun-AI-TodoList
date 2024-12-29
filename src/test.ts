export interface TestData {
	foo: string
	test: string
}
export const formatData = async (data: TestData): Promise<TestData> => {
	return { foo: data.foo, test: data.test }
}
