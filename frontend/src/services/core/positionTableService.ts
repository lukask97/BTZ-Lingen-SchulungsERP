import { createCRUDService } from "./genericService";

type PositionConfig = {
    tableName: string;
    parentField: string;
};

export function createPositionTableService(initialData: any[], config: PositionConfig) {
    const baseService = createCRUDService(config.tableName, initialData);

    const normalizePosition = (parentId: number | string, position: any = {}) => ({
        ...position,
        [config.parentField]: parentId
    });

    return {
        listAll() {
            return baseService.list();
        },
        listByParent(parentId: number | string) {
            return baseService.list().filter(item => String(item[config.parentField]) === String(parentId));
        },
        replaceForParent(parentId: number | string, positions: any[] = []) {
            const existing = this.listByParent(parentId);
            existing.forEach(item => {
                if (item.id != null) {
                    baseService.remove(item.id);
                }
            });

            return positions.map(position => baseService.create(normalizePosition(parentId, position)));
        },
        removeByParent(parentId: number | string) {
            this.listByParent(parentId).forEach(item => {
                if (item.id != null) {
                    baseService.remove(item.id);
                }
            });
        }
    };
}
