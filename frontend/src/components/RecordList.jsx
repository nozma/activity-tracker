// frontend/src/components/RecordList.jsx
import React, { useEffect, useState, useRef } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { updateRecord, deleteRecord, fetchActivityGroups } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import { Box, Button, Collapse } from '@mui/material';
import RecordFilter from './RecordFilter';
import RecordHeatmap from './RecordHeatmap';
import { useActiveActivity } from '../contexts/ActiveActivityContext';
import AddRecordDialog from './AddRecordDialog';
import { formatToLocal } from '../utils/dateUtils';


function RecordList({ records, categories, onRecordUpdate }) {
    const { activeActivity } = useActiveActivity();
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [error, setError] = useState(null);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [selectedRecordId, setSelectedRecordId] = useState(null);
    const [filterCriteria, setFilterCriteria] = useState({
        group: '',
        category: '',
        unit: '',
        activityName: '',
    });
    const [groups, setGroups] = useState([]);
    const dataGridRef = useRef(null);
    const [showRecords, setShowRecords] = useState(false);
    const [recordToEdit, setRecordToEdit] = useState(null);

    // RecordList 全体のコンテナ用 ref（Collapse を含む）
    const containerRef = useRef(null);

    // groups を API から取得する
    useEffect(() => {
        fetchActivityGroups()
            .then(data => setGroups(data))
            .catch(err => {
                console.error("Failed to fetch groups:", err);
                setError("グループの取得に失敗しました。");
            });
    }, []);

    // フィルタ条件に応じて records を絞る
    useEffect(() => {
        const { group, category, activityName } = filterCriteria;
        let filtered = records.filter((record) => {
            const groupMatch = group ? record.activity_group === group : true;
            const categoryMatch = category ? String(record.activity_category_id) === category : true;
            const nameMatch = activityName
                ? record.activity_name.toLowerCase() === activityName.toLowerCase()
                : true;
            return groupMatch && categoryMatch && nameMatch;
        });
        if (activeActivity) {
            filtered = filtered.filter(record => record.activity_id === activeActivity.id);
        }
        setFilteredRecords(filtered);
    }, [filterCriteria, records, activeActivity]);

    // 削除確認用のハンドラー
    const handleDeleteRecordClick = (recordId) => {
        setSelectedRecordId(recordId);
        setConfirmDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            await deleteRecord(selectedRecordId);
            onRecordUpdate();
        } catch (err) {
            console.error("Failed to delete record:", err);
        }
        setConfirmDialogOpen(false);
        setSelectedRecordId(null);
    };

    const handleCancelDelete = () => {
        setConfirmDialogOpen(false);
        setSelectedRecordId(null);
    };

    const handleEditRecordClick = (record) => {
        setRecordToEdit(record);
    };

    const handleEditRecordSubmit = async (updatedData) => {
        try {
            await updateRecord(recordToEdit.id, updatedData);
            onRecordUpdate();
            setRecordToEdit(null);
        } catch (error) {
            console.error("Failed to update record:", error);
        }
    };

    const processRowUpdate = async (newRow, oldRow) => {
        try {
            await updateRecord(newRow.id, newRow);
            return newRow;
        } catch (error) {
            console.error("Failed to update record:", error);
            throw error;
        }
    };

    const columns = [
        {
            field: 'created_at',
            headerName: '記録日時',
            width: 200,
            valueFormatter: (params) => formatToLocal(params)
        },
        {
            field: 'activity_category',
            headerName: 'カテゴリ',
            width: 150,
        },
        {
            field: 'activity_name',
            headerName: '項目名',
            width: 150,
        },
        {
            field: 'value',
            headerName: '記録',
            width: 150,
            editable: true,
            renderCell: (params) => {
                const val = params.row.value; // 数値（例: 10, 75など）
                const unit = params.row.unit; // "count" または "minutes"
                if (unit === 'count') {
                    return `${val}回`;
                } else if (unit === 'minutes') {
                    const hours = Math.floor(val / 60);
                    const minutes = Math.floor(val % 60);
                    return `${hours}時間${minutes}分`;
                }
                return val;
            },
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 240,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <>
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => handleDeleteRecordClick(params.row.id)}
                    >
                        Delete
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleEditRecordClick(params.row)}
                        sx={{ mr: 1 }}
                    >
                        Edit
                    </Button>
                </>
            )
        }
    ];

    return (
        <Box ref={containerRef} sx={{ mb: 2 }}>
            {error && <div>Error: {error}</div>}
            <div style={{ width: '100%' }}>
                <RecordFilter
                    groups={groups}
                    categories={categories}
                    onFilterChange={setFilterCriteria}
                    records={records}
                />
                <RecordHeatmap
                    records={filteredRecords}
                    groups={groups}
                    categories={categories}
                    unitFilter={filterCriteria.unit}
                />
                {showRecords ? (
                    <Button variant="contained" onClick={() => setShowRecords(false)} sx={{ mb: 2 }}>
                        閉じる
                    </Button>
                ) : (
                    <Button variant="contained" onClick={() => setShowRecords(true)} sx={{ mb: 2 }}>
                        すべてのレコードを表示
                    </Button>
                )}
                <Collapse
                    in={showRecords}
                    timeout={{ enter: 0, exit: 200 }}
                    onEntered={() => {
                        // 展開後に DataGrid コンテナの下端までスクロールする
                        if (dataGridRef.current) {
                            dataGridRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
                        }
                    }}
                >
                    <Box ref={dataGridRef} sx={{ height: 400, width: '100%', mb: 2 }}>
                        <DataGrid
                            rows={filteredRecords}
                            columns={columns}
                            pageSize={5}
                            rowsPerPageOptions={[5]}
                            disableSelectionOnClick
                            processRowUpdate={async (newRow, oldRow) => {
                                try {
                                    await updateRecord(newRow.id, newRow);
                                    return newRow;
                                } catch (error) {
                                    console.error("Failed to update record:", error);
                                    throw error;
                                }
                            }}
                            initialState={{
                                sorting: {
                                    sortModel: [{ field: 'created_at', sort: 'desc' }],
                                },
                            }}
                        />
                    </Box>
                </Collapse>
            </div>
            <ConfirmDialog
                open={confirmDialogOpen}
                title="Confirm Deletion"
                content="Are you sure you want to delete this record?"
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
            />
            {/* 編集用ダイアログ */}
            {recordToEdit && (
                <AddRecordDialog
                    open={true}
                    onClose={() => setRecordToEdit(null)}
                    onSubmit={handleEditRecordSubmit}
                    activity={recordToEdit}  // recordToEdit自体を渡す
                    initialValue={recordToEdit.value}
                    // 追加：編集用の場合、登録日時（created_at）の編集フィールドを表示するため、初期値として recordToEdit.created_at を渡す
                    initialDate={recordToEdit.created_at}
                    // ここで isEdit フラグを渡すなど、ダイアログ側で編集モードと判断できるようにする
                    isEdit={true}
                />
            )}
        </Box>
    );
}

export default RecordList;