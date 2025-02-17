import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import {
  Button,
  Snackbar,
  Alert,
  Box
} from '@mui/material';

// API 関連
import {
  fetchActivities,
  addActivity,
  updateActivity,
  deleteActivity,
  fetchCategories,
  createRecord
} from '../services/api';

// カスタムコンポーネント
import CustomToolbar from './CustomToolbar';
import AddActivityDialog from './AddActivityDialog';
import ConfirmDialog from './ConfirmDialog';
import AddRecordDialog from './AddRecordDialog';
import Stopwatch from './Stopwatch';
import ActivityStart from './ActivityStart';
import CategoryManagementDialog from './CategoryManagementDialog';
import GroupManagementDialog from './GroupManagementDialog';

// ユーティリティとコンテキスト
import getIconForGroup from '../utils/getIconForGroup';
import { calculateTimeDetails } from '../utils/timeUtils';
import { useActiveActivity } from '../contexts/ActiveActivityContext';

// ---------------------------------------------------------------------
// ActivityList コンポーネント本体
// ---------------------------------------------------------------------
function ActivityList({ onRecordUpdate, records }) {
    // 状態変数
    const [activities, setActivities] = useState([]);
    const [categories, setCategories] = useState([]);
    const [error, setError] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [selectedActivityId, setSelectedActivityId] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [recordDialogOpen, setRecordDialogOpen] = useState(false);
    const [stopwatchVisible, setStopwatchVisible] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [preFilledValue, setPreFilledValue] = useState(null);
    const [discordData, setDiscordData] = useState(null);
    const [showGrid, setShowGrid] = useState(false);
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [groupDialogOpen, setGroupDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const { setActiveActivity } = useActiveActivity();

    // -----------------------------------------------------------------
    // ローカルストレージからの状態復元と保存
    // -----------------------------------------------------------------
    useEffect(() => {
        const savedVisible = localStorage.getItem('stopwatchVisible');
        if (savedVisible === 'true') setStopwatchVisible(true);

        const savedActivity = localStorage.getItem('selectedActivity');
        if (savedActivity) {
            try {
                setSelectedActivity(JSON.parse(savedActivity));
            } catch (error) {
                console.error("Failed to parse selectedActivity:", error);
            }
        }

        const savedDiscordData = localStorage.getItem('discordData');
        if (savedDiscordData) {
            try {
                setDiscordData(JSON.parse(savedDiscordData));
            } catch (error) {
                console.error("Failed to parse discordData from localStorage:", error);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('stopwatchVisible', stopwatchVisible);
    }, [stopwatchVisible]);

    useEffect(() => {
        if (selectedActivity) {
            localStorage.setItem('selectedActivity', JSON.stringify(selectedActivity));
        } else {
            localStorage.removeItem('selectedActivity');
        }
    }, [selectedActivity]);

    useEffect(() => {
        if (discordData) {
            localStorage.setItem('discordData', JSON.stringify(discordData));
        } else {
            localStorage.removeItem('discordData');
        }
    }, [discordData]);

    // -----------------------------------------------------------------
    // API 呼び出し: アクティビティとカテゴリの取得
    // -----------------------------------------------------------------
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

    // エラー表示
    if (error) return <div>Error: {error}</div>;

    // -----------------------------------------------------------------
    // イベントハンドラ
    // -----------------------------------------------------------------
    const handleAddClick = () => setDialogOpen(true);
    const handleDialogClose = () => setDialogOpen(false);

    const handleActivityAdded = async (activityData) => {
        try {
            await addActivity(activityData);
            fetchActivities()
                .then(data => setActivities(data))
                .catch(err => setError(err.message));
        } catch (err) {
            console.error("Failed to add activity:", err);
        }
    };

    const handleDeleteButtonClick = (activityId) => {
        setSelectedActivityId(activityId);
        setConfirmDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            await deleteActivity(selectedActivityId);
            fetchActivities()
                .then(data => setActivities(data))
                .catch(err => setError(err.message));
        } catch (err) {
            console.error("Failed to delete activity:", err);
            setSnackbarMessage(err.message);
            setSnackbarOpen(true);
        }
        setConfirmDialogOpen(false);
        setSelectedActivityId(null);
    };

    const handleCancelDelete = () => {
        setConfirmDialogOpen(false);
        setSelectedActivityId(null);
    };

    const handleSnackbarClose = () => setSnackbarOpen(false);

    const processRowUpdate = async (newRow, oldRow) => {
        try {
            await updateActivity(newRow.id, newRow);
            return newRow;
        } catch (error) {
            console.error("Failed to update activity:", error);
            throw error;
        }
    };

    // activity を選択して開始する処理（分の場合は累計時間計算を利用）
    const handleStartRecordFromSelect = (activity) => {
        if (!activity) return;
        setSelectedActivity(activity);
        setActiveActivity(activity);
        if (activity.unit === 'count') {
            setRecordDialogOpen(true);
        } else if (activity.unit === 'minutes') {
            const details = calculateTimeDetails(activity.id, records);
            const data = {
                group: activity.category_group,
                activity_name: activity.name,
                details: details,
                asset_key: activity.asset_key || "default_image"
            };
            setDiscordData(data);
            setStopwatchVisible(true);
        }
    };

    const handleEditActivity = (activity) => {
        setSelectedActivity(activity);
        setEditDialogOpen(true);
    };

    const handleStopwatchComplete = (minutes) => {
        console.log("Stopwatch completed. Elapsed minutes:", minutes);
        setPreFilledValue(minutes);
        setStopwatchVisible(false);
        setRecordDialogOpen(true);
    };

    const handleRecordCreated = async (recordData) => {
        try {
            const res = await createRecord(recordData);
            console.log("Record created:", res);
            setRecordDialogOpen(false);
            setSelectedActivity(null);
            setPreFilledValue(null);
            onRecordUpdate();
            fetchActivities()
                .then(data => setActivities(data))
                .catch(err => setError(err.message));
        } catch (err) {
            console.error("Failed to create record:", err);
        }
    };

    // -----------------------------------------------------------------
    // データグリッドの列定義
    // -----------------------------------------------------------------
    const columns = [
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
        {
            field: 'name',
            headerName: '項目名',
            width: 200,
            renderCell: (params) => {
                const groupName = params.row.category_group;
                return (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {getIconForGroup(groupName)}
                        <span>{params.value}</span>
                    </div>
                );
            }
        },
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
            width: 240,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <>
                    <Button
                        variant="outlined"
                        color="info"
                        onClick={() => handleEditActivity(params.row)}
                        sx={{ mr: 1 }}
                    >
                        Edit
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => handleDeleteButtonClick(params.row.id)}
                    >
                        Delete
                    </Button>
                </>
            )
        }
    ];

    // -----------------------------------------------------------------
    // レンダリング部
    // -----------------------------------------------------------------
    return (
        <div>
            {/* アクティビティ選択（ストップウォッチ表示前） */}
            {!showGrid && !stopwatchVisible && (
                <ActivityStart activities={activities} onStart={handleStartRecordFromSelect} />
            )}
            {/* グリッド表示または管理画面 */}
            {!stopwatchVisible && (
                !showGrid ? (
                    <div>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2, gap: '8px' }}>
                            <Button variant="contained" onClick={() => setCategoryDialogOpen(true)}>
                                カテゴリの管理
                            </Button>
                            <Button variant="contained" onClick={() => setGroupDialogOpen(true)}>
                                グループの管理
                            </Button>
                            <Button variant="contained" onClick={() => setShowGrid(true)}>
                                アクティビティの管理
                            </Button>
                        </Box>
                        <CategoryManagementDialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)} />
                        <GroupManagementDialog open={groupDialogOpen} onClose={() => setGroupDialogOpen(false)} />
                    </div>
                ) : (
                    <>
                        <div style={{ height: 400, width: '100%', maxWidth: '800px' }}>
                            <DataGrid
                                rows={activities}
                                columns={columns}
                                pageSize={5}
                                rowsPerPageOptions={[5]}
                                disableSelectionOnClick
                                processRowUpdate={processRowUpdate}
                                slots={{ toolbar: CustomToolbar }}
                                slotProps={{
                                    toolbar: { addButtonLabel: 'Add Activity', onAddClick: handleAddClick }
                                }}
                            />
                        </div>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2, mt: 1 }}>
                            <Button variant="contained" onClick={() => setShowGrid(false)} sx={{ mb: 2 }}>
                                閉じる
                            </Button>
                        </Box>
                    </>
                )
            )}
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
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
            >
                <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
            {editDialogOpen && selectedActivity && (
                <AddActivityDialog
                    open={editDialogOpen}
                    onClose={() => setEditDialogOpen(false)}
                    onSubmit={async (activityData) => {
                        try {
                            await updateActivity(selectedActivity.id, activityData);
                            const updatedActivities = await fetchActivities();
                            setActivities(updatedActivities);
                            setEditDialogOpen(false);
                            setSelectedActivity(null);
                        } catch (err) {
                            console.error("Failed to update activity:", err);
                        }
                    }}
                    initialData={selectedActivity}
                    categories={categories}
                />
            )}
            {recordDialogOpen && selectedActivity && selectedActivity.unit === 'count' && (
                <AddRecordDialog
                    open={recordDialogOpen}
                    onClose={() => setRecordDialogOpen(false)}
                    activity={selectedActivity}
                    onSubmit={handleRecordCreated}
                    initialValue={null}
                />
            )}
            {recordDialogOpen && selectedActivity && selectedActivity.unit === 'minutes' && (
                <AddRecordDialog
                    open={recordDialogOpen}
                    onClose={() => setRecordDialogOpen(false)}
                    activity={selectedActivity}
                    onSubmit={handleRecordCreated}
                    initialValue={preFilledValue}
                />
            )}
            {stopwatchVisible && selectedActivity && selectedActivity.unit === 'minutes' && (
                <Stopwatch
                    onComplete={(minutes) => {
                        handleStopwatchComplete(minutes);
                        setActiveActivity(null);
                    }}
                    onCancel={() => {
                        setStopwatchVisible(false);
                        setSelectedActivity(null);
                        setActiveActivity(null);
                    }}
                    discordData={discordData}
                    activityName={selectedActivity.name}
                    activityGroup={selectedActivity.category_group}
                />
            )}
        </div>
    );
}

export default ActivityList;