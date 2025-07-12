import React, { useEffect, useState, useContext } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Select, DatePicker, Table, Space, Typography, Spin, Row, Col, message, Breadcrumb } from 'antd';
import { PlusOutlined, DeleteOutlined, HomeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
// import { getPKBDetail, createPKB, updatePKB, getBenhNhans, getLoaiBenhs, getThuocs, getCachDungs } from '../api'; // Ví dụ
import { AuthContext } from './App';

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

const MedicalRecordFormPage = ({ mode }) => {
    const { pkbId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(false);

    // State cho các danh mục
    const [benhNhans, setBenhNhans] = useState([]);
    const [loaiBenhs, setLoaiBenhs] = useState([]);
    const [thuocs, setThuocs] = useState([]);
    const [cachDungs, setCachDungs] = useState([]);

    const isEditMode = mode === 'edit';

    // Fetch dữ liệu danh mục khi component mount
    useEffect(() => {
        const fetchCatalogues = async () => {
            setLoading(true);
            try {
                // TODO: Gọi các API lấy danh mục
                // const [lbRes, tRes, cdRes] = await Promise.all([ getLoaiBenhs(), getThuocs(), getCachDungs() ]);
                // setLoaiBenhs(lbRes.data || []); setThuocs(tRes.data || []); setCachDungs(cdRes.data || []);
                console.log("TODO: Fetch catalogues");
            } catch (error) { message.error("Lỗi tải dữ liệu danh mục."); } 
            finally { setLoading(false); }
        };
        fetchCatalogues();
    }, []);

    // Fetch chi tiết PKB nếu là mode edit
    useEffect(() => {
        if (isEditMode && pkbId) {
            setPageLoading(true);
            // TODO: Gọi API getPKBDetail(pkbId)
            // .then(response => {
            //     const pkbData = response.data;
            //     form.setFieldsValue({
            //         ...pkbData,
            //         ngay_kham: dayjs(pkbData.ngay_kham),
            //         benh_nhan_id: pkbData.benh_nhan?.id,
            //         loai_benh_chuan_doan_id: pkbData.loai_benh_chuan_doan?.id,
            //         chi_tiet_don_thuoc: pkbData.chi_tiet_don_thuoc?.map(item => ({...item, thuoc_id: item.thuoc.id, cach_dung_chi_dinh_id: item.cach_dung_chi_dinh?.id})) || []
            //     });
            // })
            // .catch(error => message.error("Lỗi tải chi tiết phiếu khám."))
            // .finally(() => setPageLoading(false));
            console.log(`TODO: Fetch PKB detail for ID: ${pkbId}`);
            setPageLoading(false);
        } else if (location.state) { // Mode create từ WaitingList
            const { patientId, patientName, examinationDate } = location.state;
            form.setFieldsValue({
                benh_nhan_id: patientId,
                ten_benh_nhan_display: patientName,
                ngay_kham: dayjs(examinationDate),
            });
        }
    }, [isEditMode, pkbId, form, location.state]);

    const onFinish = async (values) => {
        setLoading(true);
        const payload = {
            ...values,
            ngay_kham: values.ngay_kham.format('YYYY-MM-DD'),
            chi_tiet_don_thuoc: values.chi_tiet_don_thuoc || [],
        };
        delete payload.ten_benh_nhan_display; // Xóa trường chỉ để hiển thị
        
        console.log("Submitting PKB data:", payload);
        // try {
        //     if (isEditMode) {
        //         await updatePKB(pkbId, payload);
        //         message.success("Cập nhật phiếu khám thành công!");
        //     } else {
        //         await createPKB(payload);
        //         message.success("Tạo phiếu khám thành công!");
        //     }
        //     navigate('/dashboard/medical-records/record-list');
        // } catch (error) { message.error("Thao tác thất bại."); } 
        // finally { setLoading(false); }
        setLoading(false); // Bỏ đi khi có API thật
    };

    if (pageLoading) {
        return <Spin tip="Đang tải dữ liệu..." style={{ display: 'block', marginTop: 50 }} />;
    }

    return (
        <div>
             <Breadcrumb style={{ marginBottom: 16 }}>
                <Breadcrumb.Item><Link to="/dashboard"><HomeOutlined /></Link></Breadcrumb.Item>
                <Breadcrumb.Item><Link to="/dashboard/medical-records">Quản lý khám bệnh</Link></Breadcrumb.Item>
                <Breadcrumb.Item>{isEditMode ? `Sửa Phiếu Khám #${pkbId}` : "Tạo Phiếu Khám Mới"}</Breadcrumb.Item>
            </Breadcrumb>
            
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item label="Bệnh nhân">
                            <Input value={form.getFieldValue('ten_benh_nhan_display')} disabled />
                        </Form.Item>
                        {/* Hidden field để gửi ID */}
                        <Form.Item name="benh_nhan_id" hidden><Input /></Form.Item> 
                    </Col>
                    <Col span={12}>
                        <Form.Item name="ngay_kham" label="Ngày khám" rules={[{ required: true, message: 'Vui lòng chọn ngày khám!' }]}>
                            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                        </Form.Item>
                    </Col>
                </Row>
                <Form.Item name="trieu_chung" label="Triệu chứng"><TextArea rows={2} /></Form.Item>
                <Form.Item name="loai_benh_chuan_doan_id" label="Chẩn đoán loại bệnh">
                    <Select placeholder="Chọn loại bệnh" allowClear>
                        {loaiBenhs.map(lb => <Option key={lb.id} value={lb.id}>{lb.ten_loai_benh}</Option>)}
                    </Select>
                </Form.Item>

                <Title level={5} style={{ marginTop: 20 }}>Đơn thuốc</Title>
                <Form.List name="chi_tiet_don_thuoc">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...restField }) => (
                                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                    <Form.Item {...restField} name={[name, 'thuoc_id']} rules={[{ required: true, message: 'Vui lòng chọn thuốc!' }]} style={{width: '300px'}}>
                                        <Select showSearch placeholder="Chọn thuốc" optionFilterProp="children">
                                            {thuocs.map(t => <Option key={t.id} value={t.id}>{t.ten_thuoc}</Option>)}
                                        </Select>
                                    </Form.Item>
                                    <Form.Item {...restField} name={[name, 'so_luong_ke']} rules={[{ required: true, message: 'Vui lòng nhập số lượng!' }]}>
                                        <Input type="number" placeholder="Số lượng" style={{width: '100px'}} />
                                    </Form.Item>
                                    <Form.Item {...restField} name={[name, 'cach_dung_chi_dinh_id']} style={{width: '250px'}}>
                                        <Select placeholder="Chọn cách dùng" allowClear>
                                            {cachDungs.map(cd => <Option key={cd.id} value={cd.id}>{cd.ten_cach_dung}</Option>)}
                                        </Select>
                                    </Form.Item>
                                    <DeleteOutlined onClick={() => remove(name)} />
                                </Space>
                            ))}
                            <Form.Item>
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Thêm thuốc</Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>

                <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
                    <Space>
                        <Button onClick={() => navigate(-1)}>Hủy</Button>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            {isEditMode ? "Lưu Thay Đổi" : "Tạo Phiếu Khám"}
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </div>
    );
};

export default MedicalRecordFormPage;