import React, { useEffect, useState } from 'react';
import { fetchActivities, addActivity, deleteActivity, fetchCategories } from '../services/api';
import { DataGrid } from '@mui/x-data-grid';
import CustomToolbar from './CustomToolbar';
import AddActivityDialog from './AddActivityDialog';
import ConfirmDialog from './ConfirmDialog';
import Button from '@mui/material/Button';

function ActivityList() {
    const [activities, setActivities] = useState([]);
    const [error, setError] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [selectedActivityId, setSelectedActivityId] = useState(null);

    useEffect(() => {
        fetchActivities()
            .then(data => setActivities(data))
            .catch(err => setError(err.message));
    }, []);

    useEffect(() => {
        fetchCategories()
            .then(data => setCategories(data))
            .catch(err => console.error(err));
    }, []);

    if (error) {
        return <div>Error: {error}</div>;
    }

    const handleAddClick = () => {
        setDialogOpen(true);
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
    };

    const handleActivityAdded = async (activityData) => {
        try {
            await addActivity(activityData);
            // 新規登録後、再度アクティビティ一覧を取得する
            fetchActivities()
                .then(data => setActivities(data))
                .catch(err => setError(err.message));
        } catch (err) {
            console.error("Failed to add activity:", err);
        }
    };

    // 直接の削除ではなく、確認ダイアログを表示するためのハンドラー
    const handleDeleteButtonClick = (activityId) => {
        setSelectedActivityId(activityId);
        setConfirmDialogOpen(true);
    };

    // 確認ダイアログで「Confirm」が押された場合の削除処理
    const handleConfirmDelete = async () => {
        try {
            await deleteActivity(selectedActivityId);
            fetchActivities()
                .then(data => setActivities(data))
                .catch(err => setError(err.message));
        } catch (err) {
            console.error("Failed to delete activity:", err);
        }
        setConfirmDialogOpen(false);
        setSelectedActivityId(null);
    };

    // ダイアログで「Cancel」が押された場合の処理
    const handleCancelDelete = () => {
        setConfirmDialogOpen(false);
        setSelectedActivityId(null);
    };

    const columns = [
        { field: 'id', headerName: 'ID', width: 70 },
        {
            field: 'category_group',
            headerName: 'グループ',
            width: 150,
            valueFormatter: (params) => {
                if (params === 'study') return "勉強";
                else if (params === 'game') return "ゲーム";
                else if (params === 'workout') return "運動";
                else return params;
            }
        },
        { field: 'category_name', headerName: 'カテゴリ', width: 150 },
        { field: 'name', headerName: '項目名', width: 150 },
        {
            field: 'unit',
            headerName: '記録単位',
            width: 100,
            valueFormatter: (params) => {
                if (params === 'minutes') return "分";
                else if (params === 'count') return "回";
                else return params;
            }
        },
        { field: 'asset_key', headerName: 'Asset Key', width: 150 },
        {
            field: 'created_at',
            headerName: '登録日',
            width: 200,
            valueFormatter: (params) => {
                const date = new Date(params);
                const year = date.getFullYear();
                const month = ("0" + (date.getMonth() + 1)).slice(-2);
                const day = ("0" + date.getDate()).slice(-2);
                return `${year}年${month}月${day}日`;
            }
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            filterable: false,
            renderCell: (params) => {
                return (
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => handleDeleteButtonClick(params.row.id)}
                    >
                        Delete
                    </Button>
                );
            }
        }
    ];

    return (
        <div>
            <div style={{ height: 400, width: '100%' }}>
                <DataGrid
                    rows={activities}
                    columns={columns}
                    pageSize={5}
                    rowsPerPageOptions={[5]}
                    disableSelectionOnClick
                    slots={{
                        toolbar: CustomToolbar,
                    }}
                    slotProps={{
                        toolbar: { addButtonLabel: 'Add Activity', onAddClick: handleAddClick },
                    }}
                />
            </div>
            <AddActivityDialog
                open={dialogOpen}
                onClose={handleDialogClose}
                onSubmit={handleActivityAdded}
                categories={categories}
            />
            <ConfirmDialog
                open={confirmDialogOpen}
                title="Confirm Deletion"
                content="Are you sure you want to delete this activity?"
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
            />
        </div>
    );
}

export default ActivityList;